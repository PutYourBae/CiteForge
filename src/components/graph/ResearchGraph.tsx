import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ResearchGraph as GraphData, GraphNode, GraphEdge } from '../../types/ai.types'

interface ResearchGraphProps {
  data: GraphData
  onNodeClick?: (nodeId: string) => void
}

const RADIUS = 8
const CENTER_RADIUS = 14
const COLORS = {
  center: '#4F8EF7',
  open_access: '#10B981',
  paid: '#F59E0B',
  unknown: '#2D3149',
  text: '#F1F5F9',
  edge_cites: '#4F8EF7',
  edge_cited_by: '#7C3AED',
  edge_similar: '#10B981',
}

export function ResearchGraph({ data, onNodeClick }: ResearchGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 500

    const g = svg.append('g')

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    // Arrow markers
    svg.append('defs').selectAll('marker')
      .data(['cites', 'cited_by', 'similar_topic'])
      .enter()
      .append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => d === 'cites' ? COLORS.edge_cites : d === 'cited_by' ? COLORS.edge_cited_by : COLORS.edge_similar)

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(data.edges)
        .id(d => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(30))

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('stroke', d => d.relationshipType === 'cites'
        ? COLORS.edge_cites
        : d.relationshipType === 'cited_by'
        ? COLORS.edge_cited_by
        : COLORS.edge_similar)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => d.weight * 2)
      .attr('marker-end', d => `url(#arrow-${d.relationshipType})`)

    // Draw nodes
    const nodeGroup = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (_, d) => onNodeClick?.(d.id))
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d: any) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          }) as any
      )

    // Node circles
    nodeGroup.append('circle')
      .attr('r', d => d.isCenter ? CENTER_RADIUS : RADIUS + Math.log10(d.citationCount + 1) * 2)
      .attr('fill', d => d.isCenter
        ? COLORS.center
        : d.accessStatus === 'open_access'
        ? COLORS.open_access
        : d.accessStatus === 'paid'
        ? COLORS.paid
        : COLORS.unknown)
      .attr('stroke', d => d.isCenter ? '#fff' : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', d => d.isCenter ? 2 : 1)

    // Node labels
    nodeGroup.append('text')
      .attr('dy', d => (d.isCenter ? CENTER_RADIUS : RADIUS) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', '10px')
      .attr('opacity', 0.8)
      .text(d => d.label.substring(0, 28) + (d.label.length > 28 ? '…' : ''))

    // Year label on center
    nodeGroup.filter(d => d.isCenter && !!d.year)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => d.year ?? '')

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y)
      nodeGroup.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`)
    })

    return () => simulation.stop()
  }, [data])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: '#0F1117', borderRadius: '12px' }}
    />
  )
}
