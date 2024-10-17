import { zoom, select, type ZoomBehavior, type Selection, type D3ZoomEvent } from 'd3';
import type { Project, Zone } from '$lib/types/Project';
import type { Subscription } from '$lib/stores/subscriptionStore';
import tagsData from '$lib/data/tags.json';

export function createScales(width: number, height: number, gridSpacing: number) {
    const xScale = (x: number) => x * gridSpacing + width / 2;
    const yScale = (y: number) => -y * gridSpacing + height / 2; // Negate y to flip the y-axis
    return { xScale, yScale };
}

export function createZoomBehavior(g: Selection<SVGGElement, unknown, null, undefined>): ZoomBehavior<SVGSVGElement, unknown> {
    return zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
            g.attr('transform', event.transform.toString());
        });
}

export function updateZones(
    g: Selection<SVGGElement, unknown, null, undefined>,
    zonesData: Zone[],
    xScale: (x: number) => number,
    yScale: (y: number) => number,
    gridSpacing: number,
    nodeSize: number
) {
    const paddingFactor = 1.1;
    const zonePadding = (paddingFactor - 1) * gridSpacing + nodeSize;

    const zones = g.selectAll<SVGRectElement, Zone>('rect.zone')
        .data(zonesData, (d: Zone) => d.id);

    zones.enter()
        .append('rect')
        .attr('class', 'zone')
        .merge(zones)
        .attr('x', d => {
            const x = xScale(d.x - d.width / 2) - zonePadding / 2;
            return isNaN(x) ? 0 : x;
        })
        .attr('y', d => {
            const y = yScale(d.y + d.height / 2) - zonePadding / 2;
            return isNaN(y) ? 0 : y;
        })
        .attr('width', d => {
            const width = d.width * gridSpacing + zonePadding;
            return isNaN(width) || width <= 0 ? 1 : width;
        })
        .attr('height', d => {
            const height = d.height * gridSpacing + zonePadding;
            return isNaN(height) || height <= 0 ? 1 : height;
        })
        .attr('fill', d => d.color)
        .attr('fill-opacity', 0.1)
        .attr('stroke', d => d.color)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-width', 2)
        .attr('rx', 10)
        .attr('ry', 10);

    zones.exit().remove();
}

export function updateProjects(
    g: Selection<SVGGElement, unknown, null, undefined>,
    projectsData: Project[],
    xScale: (x: number) => number,
    yScale: (y: number) => number,
    onProjectClick: (project: Project) => void,
    selectedProjectId: string | null,
    subscriptions: Record<number, Subscription[]>
) {
    const nodeSize = 120;
    const nodeRadius = 15;
    const fontSize = 14;
    const tagWidth = 40;
    const tagHeight = 16;
    const tagSpacing = 2;
    const avatarSize = 20;
    const avatarSpacing = 2;
    const avatarBackgroundSize = avatarSize + 4;

    // Create a filter for the glow effect
    const defs = g.append("defs");
    const filter = defs.append("filter")
        .attr("id", "glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    const nodes = g.selectAll<SVGGElement, Project>('g.project')
        .data(projectsData, (d: Project) => d.id);

    const nodesEnter = nodes.enter()
        .append('g')
        .attr('class', 'project')
        .on('click', (event, d) => onProjectClick(d))
        .style('cursor', 'pointer');

    nodesEnter.append('rect')
        .attr('width', nodeSize)
        .attr('height', nodeSize)
        .attr('x', -nodeSize / 2)
        .attr('y', -nodeSize / 2)
        .attr('rx', nodeRadius)
        .attr('ry', nodeRadius)
        .attr('fill', d => getTagColor(d.tags?.[0] || ''))
        .attr('fill-opacity', 0.3)
        .style('filter', 'url(#glow)')
        .style('stroke', '#ffffff')
        .style('stroke-width', '2')
        .style('stroke-opacity', '0.5')
        .style('transition', 'all 0.3s ease-out');

    // Add subscription avatars/count
    const subscriptionInfo = nodesEnter.append('g')
        .attr('class', 'subscription-info')
        .attr('transform', `translate(${nodeSize / 2 - avatarBackgroundSize * 2.85}, ${-nodeSize / 2 - avatarBackgroundSize / 2})`);

    nodesEnter.append('foreignObject')
        .attr('x', -nodeSize / 2 + 10)
        .attr('y', -nodeSize / 2 + 10)
        .attr('width', nodeSize - 20)
        .attr('height', nodeSize - 20)
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('text-align', 'center')
        .style('color', 'white')
        .style('font-size', `${fontSize}px`)
        .style('font-weight', 'bold')
        .style('overflow', 'hidden')
        .style('word-wrap', 'break-word')
        .style('user-select', 'none');

    const allNodes = nodesEnter.merge(nodes);

    allNodes.attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)
        .on('mouseenter', function() {
            select(this).select('rect')
                .style('filter', 'url(#glow) drop-shadow(0 4px 6px rgba(0,0,0,0.1))')
                .style('stroke-opacity', '1')
                .attr('fill-opacity', 0.8);
        })
        .on('mouseleave', function() {
            select(this).select('rect')
                .style('filter', 'url(#glow)')
                .style('stroke-opacity', '0.5')
                .attr('fill-opacity', 0.3);
        });

    allNodes.select('rect')
        .attr('fill', d => getTagColor(d.tags?.[0] || ''))
        .attr('fill-opacity', 0.3)
        .style('filter', 'url(#glow)')
        .style('stroke', d => d.id === selectedProjectId ? '#FFD700' : '#ffffff')
        .style('stroke-width', d => d.id === selectedProjectId ? '4' : '2')
        .style('stroke-opacity', d => d.id === selectedProjectId ? '1' : '0.5');

    // Update subscription info
    allNodes.select('.subscription-info')
        .each(function(d) {
            const node = select(this);
            const subs = subscriptions[d.project_id] || [];
            node.selectAll('*').remove(); // Clear existing content

            if (subs.length === 0) {
                return; // No subscribers, leave empty
            }

            const totalWidth = avatarBackgroundSize * Math.min(subs.length, 3);
            const xOffset = avatarBackgroundSize * 2.85 - totalWidth;

            // Add background for avatars
            node.append('rect')
                .attr('width', totalWidth)
                .attr('height', avatarBackgroundSize)
                .attr('x', xOffset)
                .attr('rx', avatarBackgroundSize / 2)
                .attr('ry', avatarBackgroundSize / 2)
                .attr('fill', 'rgba(255, 255, 255, 0.2)');

            if (subs.length <= 3) {
                subs.forEach((sub, i) => {
                    node.append('image')
                        .attr('href', sub.profile_pic || '/default_avatar.png')
                        .attr('x', xOffset + i * (avatarSize + avatarSpacing) + 2)
                        .attr('y', 2)
                        .attr('width', avatarSize)
                        .attr('height', avatarSize)
                        .attr('clip-path', 'circle(50%)')
                        .on('error', function() {
                            select(this).attr('href', '/default_avatar.png');
                        });
                });
            } else {
                // Show first two avatars
                for (let i = 0; i < 2; i++) {
                    node.append('image')
                        .attr('href', subs[i].profile_pic || '/default_avatar.png')
                        .attr('x', xOffset + i * (avatarSize + avatarSpacing) + 2)
                        .attr('y', 2)
                        .attr('width', avatarSize)
                        .attr('height', avatarSize)
                        .attr('clip-path', 'circle(50%)')
                        .on('error', function() {
                            select(this).attr('href', '/default_avatar.png');
                        });
                }
                // Add count for remaining
                node.append('text')
                    .attr('x', xOffset + 2 * (avatarSize + avatarSpacing) + avatarSize / 2 + 2)
                    .attr('y', avatarBackgroundSize / 2)
                    .attr('dy', '0.35em')
                    .attr('fill', 'white')
                    .attr('font-size', '12px')
                    .attr('font-weight', 'bold')
                    .attr('text-anchor', 'middle')
                    .text(`+${subs.length - 2}`);
            }
        });

    allNodes.select('foreignObject div')
        .each(function(d) {
            const node = select(this);
            const words = d.name.split(/\s+/);
            if (words.length === 1 && d.name.length > 12) {
                // For single long words, use a smaller font size
                node.style('font-size', '10px')
                    .text(d.name);
            } else {
                // For multiple words or short names, use the original approach
                node.style('font-size', `${fontSize}px`)
                    .text(d.name);
            }
        });

    // Update tags
    allNodes.each(function(d) {
        const node = select(this);
        const tags = (d.tags || []).slice(0, 3);

        const tagGroup = node.selectAll<SVGGElement, string>('g.tag')
            .data(tags, (t: string) => t);

        const tagEnter = tagGroup.enter()
            .append('g')
            .attr('class', 'tag')
            .attr('transform', (_, i) => `translate(${-nodeSize / 2 - tagWidth / 3}, ${-nodeSize / 2 + i * (tagHeight + tagSpacing)})`);

        tagEnter.append('rect')
            .attr('width', tagWidth)
            .attr('height', tagHeight)
            .attr('rx', 8)
            .attr('ry', 8)
            .style('stroke', 'white')
            .style('stroke-width', '1');

        tagEnter.append('text')
            .attr('x', tagWidth / 2)
            .attr('y', tagHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-weight', 'bold')
            .style('font-size', '8px');

        const allTags = tagEnter.merge(tagGroup);

        allTags.select('rect')
            .attr('fill', getTagColor)
            .style('stroke', 'white')
            .style('stroke-width', '1');

        allTags.select('text')
            .text(t => truncateText(t, tagWidth - 4, 8))
            .attr('fill', t => getContrastColor(getTagColor(t)))
            .each(function() {
                const text = select(this);
                const textLength = text.node()?.getComputedTextLength();
                if (textLength && textLength > tagWidth - 4) {
                    let fontSize = 8;
                    while (textLength > tagWidth - 4 && fontSize > 5) {
                        fontSize -= 0.5;
                        text.style('font-size', `${fontSize}px`);
                    }
                }
            });

        tagGroup.exit().remove();
    });

    nodes.exit().remove();
}

function getTagColor(tag: string): string {
    for (const category of tagsData.categories) {
        const tagData = category.tags.find(t => t.name === tag);
        if (tagData) return tagData.color;
    }
    return '#bdc3c7'; // Default color if tag is not found
}

function getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

function truncateText(text: string, maxWidth: number, fontSize: number): string {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text;

    context.font = `${fontSize}px Arial`;

    if (context.measureText(text).width <= maxWidth) {
        return text;
    }

    let truncatedText = text;
    while (context.measureText(truncatedText + '...').width > maxWidth) {
        truncatedText = truncatedText.slice(0, -1);
    }

    return truncatedText + '...';
}
