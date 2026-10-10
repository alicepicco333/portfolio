import "../styles/globals.css";

const App = ({ Component, pageProps }) => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <Component {...pageProps} />
  </>
);

export default App;
