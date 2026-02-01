'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import styles from './NetworkGraph.module.css';

interface Connection {
    processName: string;
    remoteIp: string;
    localPort: string;
    remotePort: string;
    protocol: string;
    status: string;
}

interface NetworkGraphProps {
    connections: Connection[];
}

// Extends d3.SimulationNodeDatum to include our custom properties
interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type: 'device' | 'process' | 'remote';
    radius: number;
}

// Extends d3.SimulationLinkDatum
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    type: 'process' | 'remote';
    id: string; // unique id for reconciliation
}

interface IPEnrichment {
    ip: string;
    hostname: string | null;
    asn: string;
    organization: string;
    country: string;
    service_guess: string;
    identification_method: string[];
    confidence: 'low' | 'medium' | 'high';
    notes: string;
}

export default function NetworkGraph({ connections }: NetworkGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Persistent simulation references
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

    // Selecting groups for updates
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const linkGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const nodeGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    // Persist data across renders to maintain positions
    const nodesRef = useRef<GraphNode[]>([]);
    const linksRef = useRef<GraphLink[]>([]);

    // State for IP enrichment
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [enrichment, setEnrichment] = useState<IPEnrichment | null>(null);
    const [enrichmentLoading, setEnrichmentLoading] = useState(false);

    // 1. Transform raw connections into Graph Data
    const graphData = useMemo(() => {
        const rawNodes: GraphNode[] = [];
        const rawLinks: GraphLink[] = [];
        const processSet = new Set<string>();
        const remoteSet = new Set<string>();

        // Always add device node
        rawNodes.push({
            id: 'localhost',
            label: 'This Device',
            type: 'device',
            radius: 20,
            fx: 0, // Fix device in center initially, can be un-fixed by logic if needed, but centering is good
            fy: 0
        });

        connections.forEach(conn => {
            const processId = conn.processName || 'unknown';
            const remoteId = conn.remoteIp || '0.0.0.0';

            // Filter invalid remotes
            if (remoteId === '0.0.0.0' || remoteId === '*' || remoteId === '127.0.0.1' || remoteId === '::1') return;

            // Process Node
            if (!processSet.has(processId)) {
                processSet.add(processId);
                rawNodes.push({
                    id: processId,
                    label: processId,
                    type: 'process',
                    radius: 12
                });
                rawLinks.push({
                    source: 'localhost',
                    target: processId,
                    type: 'process',
                    id: `link-localhost-${processId}`
                });
            }

            // Remote Node
            if (!remoteSet.has(remoteId)) {
                remoteSet.add(remoteId);
                rawNodes.push({
                    id: remoteId,
                    label: remoteId.length > 15 ? remoteId.slice(0, 12) + '...' : remoteId,
                    type: 'remote',
                    radius: 8
                });
            }

            // Link Process -> Remote
            const linkId = `link-${processId}-${remoteId}`;
            const linkExists = rawLinks.some(l => l.id === linkId);
            if (!linkExists) {
                rawLinks.push({
                    source: processId,
                    target: remoteId,
                    type: 'remote',
                    id: linkId
                });
            }
        });

        return { nodes: rawNodes, links: rawLinks };
    }, [connections]);

    // Fetch IP enrichment
    const fetchEnrichment = useCallback(async (ip: string) => {
        setEnrichmentLoading(true);
        try {
            const res = await fetch('/api/enrich-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
            const data = await res.json();
            if (data.success) {
                setEnrichment(data.data);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            setEnrichment({
                ip,
                hostname: null,
                asn: 'unknown',
                organization: 'unknown',
                country: 'unknown',
                service_guess: 'Unknown',
                identification_method: [],
                confidence: 'low',
                notes: 'Failed to enrich'
            });
        } finally {
            setEnrichmentLoading(false);
        }
    }, []);

    const handleNodeClick = useCallback((node: GraphNode) => {
        if (node.type === 'remote') {
            setSelectedNode(node);
            setEnrichment(null);
            fetchEnrichment(node.id);
        }
    }, [fetchEnrichment]);

    // 2. Initialize Sim & SVG (Run Once)
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 800;
        const height = 450;

        // Clean slate
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`);

        // Zoom Group
        const g = svg.append('g').attr('class', 'graph-container');
        gRef.current = g;

        // Layers
        linkGroupRef.current = g.append('g').attr('class', 'links');
        nodeGroupRef.current = g.append('g').attr('class', 'nodes');

        // Zoom Behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom as any);

        // Position device in center
        nodesRef.current = [{
            id: 'localhost', label: 'This Device', type: 'device', radius: 20, fx: 0, fy: 0
        }];

        // Force Simulation
        simulationRef.current = d3.forceSimulation<GraphNode>(nodesRef.current)
            .force('link', d3.forceLink<GraphNode, GraphLink>(linksRef.current).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300)) // Stronger repulsion
            .force('collide', d3.forceCollide().radius(d => (d as any).radius + 10).iterations(2))
            .velocityDecay(0.3)
            .on('tick', ticked);

        function ticked() {
            if (!linkGroupRef.current || !nodeGroupRef.current) return;

            linkGroupRef.current.selectAll<SVGPathElement, GraphLink>('path')
                .attr('d', (d) => {
                    const source = d.source as GraphNode;
                    const target = d.target as GraphNode;
                    // Curved lines
                    const dx = (target.x || 0) - (source.x || 0);
                    const dy = (target.y || 0) - (source.y || 0);
                    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor
                    if (d.type === 'process') {
                        // Less curved for process
                        return `M${source.x},${source.y} L${target.x},${target.y}`;
                    }
                    return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
                });

            nodeGroupRef.current.selectAll<SVGGElement, GraphNode>('g')
                .attr('transform', d => `translate(${d.x},${d.y})`);
        }

        return () => {
            simulationRef.current?.stop();
        };
    }, []);

    // 3. Handle Data Updates (Nodes entering/exiting)
    useEffect(() => {
        if (!simulationRef.current || !linkGroupRef.current || !nodeGroupRef.current) return;

        const simulation = simulationRef.current;
        const oldNodes = new Map(nodesRef.current.map(n => [n.id, n]));
        const oldLinks = new Map(linksRef.current.map(l => [l.id, l]));

        // Merge new nodes with old state (preserve x,y,vx,vy)
        const nextNodes = graphData.nodes.map(n => {
            const old = oldNodes.get(n.id);
            if (old) {
                return Object.assign(old, n); // update props, keep simulation state
            }
            return { ...n, x: 0, y: 0 }; // new node starts at center
        });

        // Merge links
        const nextLinks = graphData.links.map(l => ({ ...l }));

        // Update Refs
        nodesRef.current = nextNodes;
        linksRef.current = nextLinks;

        // Update Simulation Data
        simulation.nodes(nodesRef.current);
        (simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>).links(linksRef.current);

        // --- D3 JOIN PATTERN ---

        // 1. Links
        const links = linkGroupRef.current.selectAll<SVGPathElement, GraphLink>('path')
            .data(linksRef.current, d => d.id);

        links.exit().remove();

        const linksEnter = links.enter().append('path')
            .attr('class', d => `link ${d.type}`)
            .attr('fill', 'none')
            .attr('stroke-width', d => d.type === 'process' ? 2 : 1.5)
            .attr('stroke', d => d.type === 'process' ? 'rgba(136, 192, 208, 0.5)' : 'rgba(235, 203, 139, 0.4)')
            .attr('stroke-dasharray', d => d.type === 'remote' ? '4,4' : 'none');

        // Merge enter + update
        links.merge(linksEnter);

        // 2. Nodes
        const nodes = nodeGroupRef.current.selectAll<SVGGElement, GraphNode>('g')
            .data(nodesRef.current, d => d.id);

        nodes.exit()
            .transition().duration(300)
            .attr('opacity', 0)
            .remove();

        const nodesEnter = nodes.enter().append('g')
            .attr('class', d => `node ${d.type}`)
            .call(d3.drag<SVGGElement, GraphNode>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }) as any
            );

        // Circle
        nodesEnter.append('circle')
            .attr('r', 0) // animate in
            .transition().duration(500)
            .attr('r', d => d.radius)
            .attr('fill', d => {
                if (d.type === 'device') return 'rgba(136, 192, 208, 0.9)';
                if (d.type === 'process') return 'rgba(163, 190, 140, 0.9)';
                return 'rgba(235, 203, 139, 0.85)';
            })
            .attr('stroke', '#2e3440')
            .attr('stroke-width', 1.5);

        // Icon/Text
        nodesEnter.each(function (d) {
            const g = d3.select(this);
            if (d.type === 'device') {
                g.append('text').text('🖥️').attr('dy', 5).attr('text-anchor', 'middle');
            }
            g.append('text')
                .text(d.label)
                .attr('dy', d.radius + 12)
                .attr('text-anchor', 'middle')
                .attr('fill', '#d8dee9')
                .attr('font-size', '10px')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 2px black');
        });

        // Click handler
        nodesEnter.on('click', (event, d) => {
            event.stopPropagation();
            handleNodeClick(d);
        });

        // Restart sim with energy
        simulation.alpha(0.5).restart();

    }, [graphData, handleNodeClick]); // Runs whenever graphData changes

    return (
        <div ref={containerRef} className={styles.networkGraphContainer}>
            <svg ref={svgRef} className={styles.networkGraph} />

            {/* IP Enrichment Modal */}
            {selectedNode && (
                <div className={styles.enrichmentModal} onClick={() => setSelectedNode(null)}>
                    <div className={styles.enrichmentContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedNode(null)}>×</button>
                        <h3>🌐 Server Details</h3>
                        <div className={styles.enrichmentIp}>{selectedNode.id}</div>

                        {enrichmentLoading ? (
                            <div className={styles.enrichmentLoading}>
                                <span className={styles.spinner} />
                                Identifying server...
                            </div>
                        ) : enrichment ? (
                            <div className={styles.enrichmentData}>
                                <div className={styles.enrichmentRow}>
                                    <span className={styles.enrichmentLabel}>Service</span>
                                    <span className={styles.enrichmentValue}>{enrichment.service_guess}</span>
                                </div>
                                <div className={styles.enrichmentRow}>
                                    <span className={styles.enrichmentLabel}>Confidence</span>
                                    <span className={`${styles.enrichmentValue} ${styles[enrichment.confidence]}`}>
                                        {enrichment.confidence.toUpperCase()}
                                    </span>
                                </div>
                                {enrichment.hostname && (
                                    <div className={styles.enrichmentRow}>
                                        <span className={styles.enrichmentLabel}>Hostname</span>
                                        <span className={styles.enrichmentValue}>{enrichment.hostname}</span>
                                    </div>
                                )}
                                <div className={styles.enrichmentRow}>
                                    <span className={styles.enrichmentLabel}>Organization</span>
                                    <span className={styles.enrichmentValue}>{enrichment.organization}</span>
                                </div>
                                <div className={styles.enrichmentRow}>
                                    <span className={styles.enrichmentLabel}>ASN</span>
                                    <span className={styles.enrichmentValue}>{enrichment.asn}</span>
                                </div>
                                <div className={styles.enrichmentRow}>
                                    <span className={styles.enrichmentLabel}>Country</span>
                                    <span className={styles.enrichmentValue}>{enrichment.country}</span>
                                </div>
                                <div className={styles.enrichmentNotes}>
                                    {enrichment.notes}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.enrichmentLoading}>No details available</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
