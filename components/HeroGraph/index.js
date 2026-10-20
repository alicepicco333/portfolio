        // ...existing code...
import React, { useState, useRef, useEffect, useCallback } from "react";

const HeroGraph = ({ hovered }) => {
  // Colors
  const nodeColor = "#A8C69F";
  const lineColor = "#2B2118";
  const textColor = "#2B2118";
  const subNodeColor = "#FFC1CF";

  // Original node positions with subnodes (in percentage) - central positions
  const originalNodes = [
    { 
      id: 1, 
      label: "Research", 
      x: 38, 
      y: 42,
      subnodes: ["User Research", "Systems Thinking", "Human Computer Interaction", "Cultural Analytics", "Digital Humanities"]
    },
    { 
      id: 2, 
      label: "Design", 
      x: 62, 
      y: 45,
      subnodes: ["UX Design", "Interaction Design", "Visual Design", "3D"]
    },
    { 
      id: 3, 
      label: "Development", 
      x: 50, 
      y: 58,
      subnodes: ["Front-end Development", "Creative Coding", "Data Visualization"]
    },
  ];

  // Connections between nodes
  const edges = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 1 },
  ];

  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const rotationAngle = useRef(0);
  const targetOffsets = useRef(originalNodes.map(() => ({ x: 0, y: 0 })));
  const currentOffsets = useRef(originalNodes.map(() => ({ x: 0, y: 0 })));
  const lastTargetChange = useRef(Date.now());
  const spreadFactorRef = useRef(1);
  
  const [nodePositions, setNodePositions] = useState(
    originalNodes.map((n) => ({ x: n.x, y: n.y }))
  );
  const [rotation, setRotation] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredSubnode, setHoveredSubnode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [subnodeOffsets, setSubnodeOffsets] = useState({});

  // Check if all nodes have been expanded
  const allExpanded = expandedNodes.size === originalNodes.length;
  
  // Calculate spread factor based on expanded nodes
  const spreadFactor = expandedNodes.size > 0 ? 1 + expandedNodes.size * 0.15 : 1;
  
  // Update ref when spreadFactor changes
  useEffect(() => {
    spreadFactorRef.current = spreadFactor;
  }, [spreadFactor]);

  // Handle node hover - keeps it expanded
  const handleNodeHover = (nodeId) => {
    setHoveredNode(nodeId);
    setExpandedNodes((prev) => new Set([...prev, nodeId]));
  };

  // Reset all expanded nodes
  const handleReset = () => {
    setExpandedNodes(new Set());
    setHoveredNode(null);
    setHoveredSubnode(null);
    setSubnodeOffsets({});
  };

  // Connection groups - subnodes that should be linked when any is hovered
  const subnodeConnections = [
    ["User Research", "UX Design", "Front-end Development"],
    ["Systems Thinking", "Cultural Analytics", "Interaction Design"],
    ["Digital Humanities", "Cultural Analytics", "Data Visualization"],
    ["Human Computer Interaction", "3D", "Creative Coding"],
  ];

  const getRelativeCoords = useCallback((e) => {
    if (!containerRef.current) return { x: -1000, y: -1000 };
    const rect = containerRef.current.getBoundingClientRect();
    
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    mousePos.current = getRelativeCoords(e);
  }, [getRelativeCoords]);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = { x: -1000, y: -1000 };
    setHoveredNode(null);
  }, []);

  // Calculate subnode positions around parent - direction based on position
  const getSubnodePositions = (parentPos, subnodes, nodeIndex, applyOffsets = true) => {
    // Larger radius to give more space between subnodes
    const baseRadius = 14;
    const radiusPerNode = 2.5;
    const radius = baseRadius + subnodes.length * radiusPerNode;
    
    // Determine which direction to expand based on parent position
    let baseAngle;
    if (parentPos.y > 50) {
      // Near bottom - expand upward
      baseAngle = -Math.PI / 2;
    } else if (parentPos.y < 40) {
      // Near top - expand downward
      baseAngle = Math.PI / 2;
    } else if (parentPos.x < 40) {
      // Near left - expand right
      baseAngle = 0;
    } else if (parentPos.x > 60) {
      // Near right - expand left
      baseAngle = Math.PI;
    } else {
      // Central - default based on node index
      baseAngle = nodeIndex === 0 ? -Math.PI / 2 : nodeIndex === 1 ? 0 : Math.PI / 2;
    }
    
    // Much wider spread to prevent overlap - each subnode needs significant space
    const minSpacing = Math.PI * 0.4; // Larger minimum angle between each subnode
    const angleSpread = Math.min(Math.PI * 1.6, minSpacing * (subnodes.length - 1));
    
    // Clamp to safe boundaries
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    return subnodes.map((label, i) => {
      const angleStep = subnodes.length > 1 ? angleSpread / (subnodes.length - 1) : 0;
      const angle = baseAngle - angleSpread / 2 + i * angleStep;
      
      let rawX = parentPos.x + Math.cos(angle) * radius;
      let rawY = parentPos.y + Math.sin(angle) * radius * 0.8;
      
      // Apply stored offsets from repulsion
      if (applyOffsets && subnodeOffsets[label]) {
        rawX += subnodeOffsets[label].x;
        rawY += subnodeOffsets[label].y;
      }
      
      return {
        label,
        x: clamp(rawX, 8, 92),
        y: clamp(rawY, 10, 90),
      };
    });
  };

  useEffect(() => {
    const minDistance = 20; // Minimum distance between nodes (percentage)
    const driftSpeed = 0.003; // Slow but visible movement
    const targetChangeInterval = 6000; // Change targets every 6 seconds
    const maxDrift = 3; // Small drift from original position
    
    // Boundary constraints (percentage) - keep nodes central
    const minX = 20;
    const maxX = 80;
    const minY = 25;
    const maxY = 75;
    
    // Calculate center of triangle
    const centerX = originalNodes.reduce((sum, n) => sum + n.x, 0) / originalNodes.length;
    const centerY = originalNodes.reduce((sum, n) => sum + n.y, 0) / originalNodes.length;

    const clampPosition = (x, y) => ({
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    });

    const generateNewTargets = () => {
      const newTargets = originalNodes.map((node) => {
        // Generate small random offset
        let offsetX = (Math.random() - 0.5) * maxDrift * 2;
        let offsetY = (Math.random() - 0.5) * maxDrift * 2;
        
        // Clamp to ensure final position stays in bounds
        const finalX = node.x + offsetX;
        const finalY = node.y + offsetY;
        const clamped = clampPosition(finalX, finalY);
        
        return {
          x: clamped.x - node.x,
          y: clamped.y - node.y,
        };
      });
      
      // Ensure minimum distance between all pairs
      for (let i = 0; i < newTargets.length; i++) {
        for (let j = i + 1; j < newTargets.length; j++) {
          const pos1 = {
            x: originalNodes[i].x + newTargets[i].x,
            y: originalNodes[i].y + newTargets[i].y,
          };
          const pos2 = {
            x: originalNodes[j].x + newTargets[j].x,
            y: originalNodes[j].y + newTargets[j].y,
          };
          const dist = Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
          );
          
          if (dist < minDistance) {
            // Push targets apart
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const pushDist = (minDistance - dist) / 2;
            const angle = Math.atan2(dy, dx);
            newTargets[i].x -= Math.cos(angle) * pushDist;
            newTargets[i].y -= Math.sin(angle) * pushDist;
            newTargets[j].x += Math.cos(angle) * pushDist;
            newTargets[j].y += Math.sin(angle) * pushDist;
          }
        }
      }
      
      targetOffsets.current = newTargets;
    };

    generateNewTargets();

    const animate = () => {
      const now = Date.now();
      
      // Change targets periodically
      if (now - lastTargetChange.current > targetChangeInterval) {
        generateNewTargets();
        lastTargetChange.current = now;
      }

      // No rotation - removed to keep nodes within bounds

      // Smoothly move current offsets toward targets
      setNodePositions((prevPositions) => {
        const newPositions = prevPositions.map((pos, i) => {
          const original = originalNodes[i];
          const target = targetOffsets.current[i];
          const current = currentOffsets.current[i];
          
          // Lerp toward target (very smooth)
          current.x += (target.x - current.x) * driftSpeed;
          current.y += (target.y - current.y) * driftSpeed;
          
          // Mouse interaction (very subtle)
          const mouseX = mousePos.current.x;
          const mouseY = mousePos.current.y;
          const dx = (original.x + current.x) - mouseX;
          const dy = (original.y + current.y) - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let pushX = 0;
          let pushY = 0;
          if (dist > 0 && dist < 15) {
            const force = (15 - dist) / 15 * 0.3;
            pushX = (dx / dist) * force;
            pushY = (dy / dist) * force;
          }
          
          // Calculate final position with boundary clamping and spread
          // Push nodes away from center based on spreadFactor
          const dirX = original.x - centerX;
          const dirY = original.y - centerY;
          const currentSpread = spreadFactorRef.current;
          const spreadX = dirX * (currentSpread - 1);
          const spreadY = dirY * (currentSpread - 1);
          
          const finalX = Math.max(minX, Math.min(maxX, original.x + current.x + pushX + spreadX));
          const finalY = Math.max(minY, Math.min(maxY, original.y + current.y + pushY + spreadY));
          
          return {
            x: finalX,
            y: finalY,
          };
        });

        return newPositions;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Subnode repulsion effect - runs when expanded nodes change
  useEffect(() => {
    if (expandedNodes.size === 0) {
      setSubnodeOffsets({});
      return;
    }

    // Collect all visible subnodes with their base positions
    const allSubnodes = [];
    originalNodes.forEach((node, i) => {
      if (expandedNodes.has(node.id)) {
        const positions = getSubnodePositions(nodePositions[i], node.subnodes, i, false);
        positions.forEach((pos) => {
          allSubnodes.push({ label: pos.label, x: pos.x, y: pos.y, offsetX: 0, offsetY: 0 });
        });
      }
    });

    // Minimum distance - subnodes are ~100px wide, so need ~12% separation minimum
    const minDist = 12;
    const mainNodeDist = 14;
    
    // Run multiple iterations to fully separate overlapping nodes
    for (let iteration = 0; iteration < 20; iteration++) {
      let hasOverlap = false;
      
      // Check each pair of subnodes
      for (let i = 0; i < allSubnodes.length; i++) {
        for (let j = i + 1; j < allSubnodes.length; j++) {
          const a = allSubnodes[i];
          const b = allSubnodes[j];
          
          const dx = (b.x + b.offsetX) - (a.x + a.offsetX);
          const dy = (b.y + b.offsetY) - (a.y + a.offsetY);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDist && dist > 0) {
            hasOverlap = true;
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.5;
            const pushY = (dy / dist) * overlap * 0.5;
            
            a.offsetX -= pushX;
            a.offsetY -= pushY;
            b.offsetX += pushX;
            b.offsetY += pushY;
          } else if (dist === 0) {
            // Exactly same position - push apart randomly
            hasOverlap = true;
            const angle = Math.random() * Math.PI * 2;
            a.offsetX -= Math.cos(angle) * minDist * 0.5;
            a.offsetY -= Math.sin(angle) * minDist * 0.5;
            b.offsetX += Math.cos(angle) * minDist * 0.5;
            b.offsetY += Math.sin(angle) * minDist * 0.5;
          }
        }
        
        // Also repel from main nodes
        const a = allSubnodes[i];
        nodePositions.forEach((mainNode) => {
          const dx = (a.x + a.offsetX) - mainNode.x;
          const dy = (a.y + a.offsetY) - mainNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mainNodeDist && dist > 0) {
            hasOverlap = true;
            const overlap = mainNodeDist - dist;
            const pushX = (dx / dist) * overlap;
            const pushY = (dy / dist) * overlap;
            a.offsetX += pushX;
            a.offsetY += pushY;
          }
        });
      }
      
      if (!hasOverlap) break;
    }
    
    // Build final offsets map
    const newOffsets = {};
    allSubnodes.forEach((subnode) => {
      if (subnode.offsetX !== 0 || subnode.offsetY !== 0) {
        // Clamp offsets to keep within bounds
        newOffsets[subnode.label] = {
          x: Math.max(-20, Math.min(20, subnode.offsetX)),
          y: Math.max(-20, Math.min(20, subnode.offsetY)),
        };
      }
    });
    
    setSubnodeOffsets(newOffsets);
  }, [expandedNodes, nodePositions]);

  const getNodeById = (id) => {
    const index = originalNodes.findIndex((n) => n.id === id);
    return nodePositions[index];
  };

  // Get all subnode positions as a flat map for connection drawing
  const getAllSubnodePositions = () => {
    const positions = {};
    originalNodes.forEach((node, i) => {
      const subnodePositions = getSubnodePositions(nodePositions[i], node.subnodes, i);
      subnodePositions.forEach((subnode) => {
        positions[subnode.label] = { x: subnode.x, y: subnode.y };
      });
    });
    return positions;
  };

  // Find which connection group the hovered subnode belongs to
  const getActiveConnectionGroup = () => {
    if (!hoveredSubnode) return null;
    return subnodeConnections.find((group) => group.includes(hoveredSubnode));
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 1, zIndex: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 w-full h-full"
      >
        {/* SVG for lines only */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* CSS animation for dashing */}
          <defs>
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
              `}
            </style>
          </defs>
          
          {/* Main edges */}
          {edges.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            return (
              <line
                key={i}
                x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={lineColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Subnode edges */}
        {originalNodes.map((node, i) => {
          const isExpanded = expandedNodes.has(node.id);
          const subnodePositions = getSubnodePositions(nodePositions[i], node.subnodes, i);
          
          return isExpanded && subnodePositions.map((subnode, j) => (
            <line
              key={`subedge-${node.id}-${j}`}
              x1={`${nodePositions[i].x}%`}
              y1={`${nodePositions[i].y}%`}
              x2={`${subnode.x}%`}
              y2={`${subnode.y}%`}
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 0.15s ease",
              }}
            />
          ));
        })}
        
        {/* Dashed connection lines between related subnodes */}
        {(() => {
          const activeGroup = getActiveConnectionGroup();
          if (!activeGroup) return null;
          
          const allPositions = getAllSubnodePositions();
          const lines = [];
          
          // Draw lines connecting consecutive subnodes in the group
          for (let i = 0; i < activeGroup.length - 1; i++) {
            const from = allPositions[activeGroup[i]];
            const to = allPositions[activeGroup[i + 1]];
            if (from && to) {
              lines.push(
                <line
                  key={`connection-${i}`}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="#A8C69F"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  style={{
                    animation: "dash 0.5s linear infinite",
                  }}
                />
              );
            }
          }
          return lines;
        })()}
      </svg>

      {/* Nodes as divs */}
      {originalNodes.map((node, i) => {
        const isExpanded = expandedNodes.has(node.id);
        const subnodePositions = getSubnodePositions(nodePositions[i], node.subnodes, i);
        
        return (
          <React.Fragment key={node.id}>
            {/* Subnodes */}
            {subnodePositions.map((subnode, j) => (
              <div
                key={`subnode-${node.id}-${j}`}
                className="absolute flex items-center justify-center text-center px-3 py-2"
                style={{
                  left: `${subnode.x}%`,
                  top: `${subnode.y}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: subNodeColor,
                  borderRadius: "24px",
                  minWidth: "100px",
                  padding: "8px 12px",
                  opacity: isExpanded ? 1 : 0,
                  scale: isExpanded ? "1" : "0.8",
                  transition: `opacity 0.15s ease ${j * 0.02}s, scale 0.15s ease ${j * 0.02}s`,
                  pointerEvents: isExpanded ? "auto" : "none",
                  zIndex: 20,
                }}
                onMouseEnter={() => setHoveredSubnode(subnode.label)}
                onMouseLeave={() => setHoveredSubnode(null)}
              >
                <span
                  style={{
                    color: textColor,
                    fontSize: "12px",
                    fontWeight: "500",
                    lineHeight: "1.2",
                  }}
                >
                  {subnode.label}
                </span>
              </div>
            ))}
            
            {/* Main node */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: `${nodePositions[i].x}%`,
                top: `${nodePositions[i].y}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: nodeColor,
                borderRadius: "24px",
                minWidth: "110px",
                padding: "10px 16px",
                zIndex: 10,
              }}
              onMouseEnter={() => handleNodeHover(node.id)}
            >
              <span
                style={{
                  color: textColor,
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                {node.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      
      {/* Close button - appears when all nodes have been expanded */}
      {allExpanded && (
        <button
          onClick={handleReset}
          className="absolute flex items-center justify-center"
          style={{
            top: "10px",
            right: "10px",
            width: "32px",
            height: "32px",
            backgroundColor: nodeColor,
            borderRadius: "50%",
            border: "none",
            zIndex: 30,
            transition: "transform 0.15s ease, background-color 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <span style={{ color: textColor, fontSize: "18px", fontWeight: "bold", lineHeight: 1 }}>×</span>
        </button>
      )}
      </div>
    </div>
  );
};

export default HeroGraph;
