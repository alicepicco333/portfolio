"""Regenerates the plates' ComfyUI pictures from prompts.json through ComfyUI's HTTP API.

ComfyUI portable: C:\\Users\\awlic\\ComfyUI (SDXL base 1.0, controlnet-depth-sdxl-small).
Start it (python_embeded\\python.exe -s ComfyUI\\main.py --windows-standalone-build), then:
    python run.py                 every image in prompts.json, with its recorded seed
    python run.py fungus          one image
    python run.py fungus --try 4  four new seeds for one image (to pick from; record the chosen seed)
Outputs go to ../_render/comfy/<name>-<seed>.png; the chosen ones are copied by hand to ../img/comfy-<name>.jpg.
"""
import json, os, random, sys, time, urllib.request, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '_render', 'comfy')
API = 'http://127.0.0.1:8188'
os.makedirs(OUT, exist_ok=True)


def call(path, data=None):
    req = urllib.request.Request(API + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def upload(path):
    """Uploads a control or init image; returns its name on the server."""
    boundary = uuid.uuid4().hex
    name = os.path.basename(path)
    with open(path, 'rb') as f:
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
                f'Content-Type: image/png\r\n\r\n').encode() + f.read() + f'\r\n--{boundary}\r\n'.encode() + \
               (f'Content-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n').encode()
    req = urllib.request.Request(API + '/upload/image', data=body,
                                 headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['name']


def graph(job, settings, seed):
    s = {**settings, **job.get('settings', {})}
    if job.get('upscale'):  # a real picture, only enlarged (RealESRGAN x4), nothing generated
        return {
            'img': {'class_type': 'LoadImage', 'inputs': {'image': upload(os.path.join(HERE, job['upscale']))}},
            'um': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': job['model']}},
            'up': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['um', 0], 'image': ['img', 0]}},
            'save': {'class_type': 'SaveImage', 'inputs': {'images': ['up', 0], 'filename_prefix': 'junior-plates/tmp'}},
        }
    g = {
        'ckpt': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': s['checkpoint']}},
        'pos': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['ckpt', 1], 'text': job['prompt']}},
        'neg': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['ckpt', 1], 'text': job.get('negative', s['negative'])}},
        'latent': {'class_type': 'EmptyLatentImage', 'inputs': {'width': s['width'], 'height': s['height'], 'batch_size': 1}},
    }
    positive, negative, latent = ['pos', 0], ['neg', 0], ['latent', 0]
    if job.get('depth'):  # depth control from a depth render of the 3D scene
        g['dimg'] = {'class_type': 'LoadImage', 'inputs': {'image': upload(os.path.join(HERE, job['depth']))}}
        g['cn'] = {'class_type': 'ControlNetLoader', 'inputs': {'control_net_name': s['controlnet']}}
        g['apply'] = {'class_type': 'ControlNetApplyAdvanced', 'inputs': {
            'positive': positive, 'negative': negative, 'control_net': ['cn', 0], 'image': ['dimg', 0],
            'strength': s.get('depth_strength', 0.6), 'start_percent': 0.0, 'end_percent': s.get('depth_end', 0.8)}}
        positive, negative = ['apply', 0], ['apply', 1]
    if job.get('init'):  # img2img
        g['iimg'] = {'class_type': 'LoadImage', 'inputs': {'image': upload(os.path.join(HERE, job['init']))}}
        g['enc'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': ['iimg', 0], 'vae': ['ckpt', 2]}}
        latent = ['enc', 0]
    g['ks'] = {'class_type': 'KSampler', 'inputs': {
        'model': ['ckpt', 0], 'positive': positive, 'negative': negative, 'latent_image': latent, 'seed': seed,
        'steps': s['steps'], 'cfg': s['cfg'], 'sampler_name': s['sampler'], 'scheduler': s['scheduler'],
        'denoise': s.get('denoise', 1.0)}}
    g['dec'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks', 0], 'vae': ['ckpt', 2]}}
    g['save'] = {'class_type': 'SaveImage', 'inputs': {'images': ['dec', 0], 'filename_prefix': 'junior-plates/tmp'}}
    return g


def run(name, job, settings, seed):
    pid = call('/prompt', {'prompt': graph(job, settings, seed), 'client_id': 'junior-plates'})['prompt_id']
    while True:
        h = call('/history/' + pid)
        if pid in h and h[pid].get('outputs'):
            break
        if pid in h and h[pid].get('status', {}).get('status_str') == 'error':
            raise SystemExit(json.dumps(h[pid]['status'], indent=1)[:2000])
        time.sleep(1.5)
    img = h[pid]['outputs']['save']['images'][0]
    q = f"/view?filename={img['filename']}&subfolder={img['subfolder']}&type=output"
    dest = os.path.join(OUT, f'{name}-{seed}.png')
    with urllib.request.urlopen(API + q) as r, open(dest, 'wb') as f:
        f.write(r.read())
    print('saved', dest)


def main():
    cfg = json.load(open(os.path.join(HERE, 'prompts.json'), encoding='utf-8'))
    args = sys.argv[1:]
    tries = 0
    if '--try' in args:
        i = args.index('--try'); tries = int(args[i + 1]); del args[i:i + 2]
    jobs = {**cfg['images'], **cfg.get('upscales', {})}
    names = args or list(jobs)
    for name in names:
        job = jobs[name]
        seeds = [random.randrange(2**32) for _ in range(tries)] if tries else [job['seed']]
        for seed in seeds:
            run(name, job, cfg['settings'], seed)


if __name__ == '__main__':
    main()
