import { AravtListItem } from '@/types';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface AravtRadialTreeProps {
  aravts: AravtListItem[];
}

interface TreeNode {
  id: number;
  name: string;
  description?: string | null;
  isDraft?: boolean;
  parentId?: number | null;
  isVirtual?: boolean;
  children?: TreeNode[];
}

const AravtRadialTree = ({ aravts }: AravtRadialTreeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const navigate = useNavigate();

  useEffect(() => {
    if (!aravts.length || !svgRef.current) return;

    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Transform aravts data into hierarchical structure
    const hierarchyData = buildHierarchy(aravts);
    
    // Set up dimensions
    const width = 1100;
    const height = 900;
    const radius = Math.min(width, height) / 2 - 80;

    // Create the SVG container with zoom/pan support
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    const zoomLayer = svg.append('g');
    const svgContent = zoomLayer.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        zoomLayer.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    // Re-apply last transform after re-render (prevents reset on data refetch)
    if (transformRef.current) {
      zoomLayer.attr('transform', transformRef.current.toString());
      svg.call(zoomBehavior.transform, transformRef.current);
    }

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
    svgContent.selectAll('.link')
      .data(treeData.links().filter(d => !d.source.data.isVirtual && !d.target.data.isVirtual))
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1.2)
      .attr('d', d => {
        const linkRadial = d3.linkRadial<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
          .angle(d => d.x)
          .radius(d => d.y);
        return linkRadial(d);
      });

    // Add nodes
    const node = svgContent.selectAll('.node')
      .data(treeData.descendants().filter(d => !d.data.isVirtual))
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${radialPoint(d.x, d.y)})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        // Navigate to aravt details
        navigate(`/dashboard/${d.data.id}`);
      });

    // Add circles to nodes
    node.append('circle')
      .attr('r', 7)
      .attr('fill', d => d.data.isDraft ? '#f59e0b' : (d.children ? '#111827' : '#6b7280'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes (horizontal for readability)
    node.append('text')
      .attr('dy', d => d.depth === 0 ? '-0.9em' : '0.31em')
      .attr('x', d => {
        if (d.depth === 0) return 0;
        const isLeft = d.x > Math.PI;
        return isLeft ? -10 : 10;
      })
      .attr('text-anchor', d => {
        if (d.depth === 0) return 'middle';
        return d.x > Math.PI ? 'end' : 'start';
      })
      .attr('transform', d => {
        if (d.depth === 0) return '';
        // keep text horizontal
        const angleDeg = (d.x * 180) / Math.PI - 90;
        const mirror = d.x > Math.PI ? 180 : 0;
        return `rotate(${angleDeg + mirror})`;
      })
      .text(d => d.data.name)
      .clone(true).lower()
      .attr('stroke', 'white')
      .attr('stroke-width', 3);

    // Native tooltip
    node.append('title')
      .text(d => d.data.description ?? 'Без описания');

  }, [aravts, navigate]);
  // Helper function to convert polar to Cartesian coordinates
  // Adjust the angle to start from the top (π/2) instead of from the right (0)
  const radialPoint = (x: number, y: number): [number, number] => {
    return [y * Math.sin(x), -y * Math.cos(x)]; // Changed formula to start from top
  };

  // Build hierarchy from flat aravts array
  const buildHierarchy = (aravts: AravtListItem[]): TreeNode => {
    const virtualRoot: TreeNode = { id: 0, name: 'All Aravts', children: [], isVirtual: true };

    if (!aravts.length) {
      return virtualRoot;
    }

    const nodesMap = new Map<number, TreeNode>();
    const parentMap = new Map<number, number | null>();

    // First pass: create all nodes
    aravts.forEach((aravt) => {
      nodesMap.set(aravt.id, {
        id: aravt.id,
        name: aravt.name,
        description: aravt.description,
        isDraft: aravt.is_draft,
        parentId: aravt.aravt_father_id,
        children: [],
      });
      parentMap.set(aravt.id, aravt.aravt_father_id ?? null);
    });

    const isCircular = (childId: number, parentId: number | null): boolean => {
      let current: number | null = parentId;
      while (current !== null) {
        if (current === childId) return true;
        current = parentMap.get(current) ?? null;
      }
      return false;
    };

    const roots: TreeNode[] = [];

    // Second pass: establish parent-child relationships
    nodesMap.forEach((node) => {
      const parentId = node.parentId ?? null;
      if (parentId === null) {
        roots.push(node);
        return;
      }

      if (parentId === node.id) {
        console.warn('Aravt references itself as parent, skipping link', node.id);
        roots.push(node);
        return;
      }

      if (isCircular(node.id, parentId)) {
        console.warn('Detected circular aravt link, skipping', { child: node.id, parent: parentId });
        roots.push(node);
        return;
      }

      const parentNode = nodesMap.get(parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
      } else {
        // Orphan: attach to roots
        roots.push(node);
      }
    });

    // If только один корень, используем его напрямую без виртуального
    if (roots.length === 1) {
      return roots[0];
    }

    virtualRoot.children = roots;
    return virtualRoot;
  };

  return (
    <div className="w-full overflow-auto flex flex-col items-center gap-3 relative">
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-md bg-white/90 px-3 py-1 text-sm text-blue-600 shadow hover:bg-white"
        onClick={() => {
          if (svgRef.current && zoomBehaviorRef.current) {
            d3.select(svgRef.current)
              .transition()
              .duration(300)
              .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
          }
        }}
      >
        Reset view
      </button>
      <svg ref={svgRef} className="aravt-tree min-h-[720px] max-w-[1200px]"></svg>
      <div className="flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#111827' }} />
          <span>Aravt</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#6b7280' }} />
          <span>New Aravt</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#f59e0b' }} />
          <span>Draft</span>
        </div>
      </div>
    </div>
  );
};

export default AravtRadialTree;
