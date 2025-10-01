import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Aravt } from '@/types';

interface AravtRadialTreeProps {
  aravts: Aravt[];
}

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[];
}

const AravtRadialTree = ({ aravts }: AravtRadialTreeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!aravts.length || !svgRef.current) return;

    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Transform aravts data into hierarchical structure
    const hierarchyData = buildHierarchy(aravts);
    
    // Set up dimensions
    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2 - 40;

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create the hierarchical data structure
    const root = d3.hierarchy<TreeNode>(hierarchyData);
    
    // Create a radial tree layout
    // Start from the top (π/2) instead of from the right (0)
    const tree = d3.tree<TreeNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Apply the layout to the hierarchy
    const treeData = tree(root);

    // Add links between nodes
    svg.selectAll('.link')
      .data(treeData.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('d', d => {
        const linkRadial = d3.linkRadial<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
          .angle(d => d.x)
          .radius(d => d.y);
        return linkRadial(d);
      });

    // Add nodes
    const node = svg.selectAll('.node')
      .data(treeData.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${radialPoint(d.x, d.y)})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        // Navigate to aravt details or expand/collapse node
        console.log('Clicked node:', d.data);
      });

    // Add circles to nodes
    node.append('circle')
      .attr('r', 5)
      .attr('fill', d => d.children ? '#555' : '#999');

    // Add labels to nodes
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => (d.x >= Math.PI / 2 && d.x < 3 * Math.PI / 2) ? -6 : 6)
      .attr('text-anchor', d => (d.x >= Math.PI / 2 && d.x < 3 * Math.PI / 2) ? 'end' : 'start')
      .attr('transform', d => {
        // Rotate text to be readable from outside the circle
        let angle = (d.x * 180 / Math.PI - 90); // Convert radians to degrees and adjust
        // Flip text that would be upside down
        if (d.x >= Math.PI / 2 && d.x < 3 * Math.PI / 2) {
          angle += 180;
        }
        return `rotate(${angle})`;
      })
      .text(d => d.data.name)
      .clone(true).lower()
      .attr('stroke', 'white')
      .attr('stroke-width', 3);

  }, [aravts]);
  // Helper function to convert polar to Cartesian coordinates
  // Adjust the angle to start from the top (π/2) instead of from the right (0)
  const radialPoint = (x: number, y: number): [number, number] => {
    return [y * Math.sin(x), -y * Math.cos(x)]; // Changed formula to start from top
  };

  // Build hierarchy from flat aravts array
  const buildHierarchy = (aravts: Aravt[]): TreeNode => {
    // Create a root node
    const root: TreeNode = { id: 0, name: 'All Aravts', children: [] };
    
    // Map to store nodes by id for quick lookup
    const nodesMap = new Map<number, TreeNode>();
    nodesMap.set(0, root);
    
    // First pass: create all nodes
    aravts.forEach(aravt => {
      nodesMap.set(aravt.id, {
        id: aravt.id,
        name: aravt.name,
        children: []
      });
    });
    
    // Second pass: establish parent-child relationships
    aravts.forEach(aravt => {
      const node = nodesMap.get(aravt.id);
      if (node) {
        if (aravt.aravt_father) {
          // Add to parent's children
          const parentNode = nodesMap.get(aravt.aravt_father.id);
          if (parentNode && parentNode.children) {
            parentNode.children.push(node);
          }
        } else {
          // No parent, add to root
          if (root.children) {
            root.children.push(node);
          }
        }
      }
    });
    
    return root;
  };

  return (
    <div className="w-full overflow-auto flex justify-center">
      <svg ref={svgRef} className="aravt-tree"></svg>
    </div>
  );
};

export default AravtRadialTree;


// https://dev.aravt.io/data
// https://observablehq.com/@d3/radial-tree/2