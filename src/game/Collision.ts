import Vector2, { rotate } from "./Vector2";

export default interface Collision {
    position: Vector2;
    normal: Vector2;
}

export interface BoundingBox {
    position: Vector2;
    width: number;
    height: number;
    angle: number;
}

type Polygon = Vector2[];
type Line = [Vector2, Vector2];
type Lines = Line[];

export function rectangleToPolygon(rect: BoundingBox): Polygon {
    const {
        position,
        width,
        height,
        angle
    } = rect;
    const points: Vector2[] = [
        {x: -width/2, y: -height/2},
        {x: width/2, y: -height/2},
        {x: width/2, y: height/2},
        {x: -width/2, y: height/2}
    ];
    const rotatedPoints = points.map(point => rotate(point, angle));
    return rotatedPoints.map(point => ({
        x: point.x + position.x,
        y: point.y + position.y
    }));
}

function doLinesIntersect(line1: Line, line2: Line): boolean {
    const [start1, end1] = line1;
    const [start2, end2] = line2;
    const denominator = ((end1.y - start1.y) * (end2.x - start2.x)) - ((end1.x - start1.x) * (end2.y - start2.y));
    if (denominator === 0) {
        return false;
    }
    const numerator1 = ((end1.x - start1.x) * (start2.y - start1.y)) - ((end1.y - start1.y) * (start2.x - start1.x));
    const numerator2 = ((end2.x - start2.x) * (start1.y - start2.y)) - ((end2.y - start2.y) * (start1.x - start2.x));
    const r = numerator1 / denominator;
    const s = numerator2 / denominator;
    return (r >= 0 && r <= 1) && (s >= 0 && s <= 1);
}

export function polygonToLines(polygon: Polygon): Lines {
    const lines: Lines = [];
    for (let i = 0; i < polygon.length; i++) {
        const start = polygon[i];
        const end = polygon[(i + 1) % polygon.length];
        lines.push([start, end]);
    }
    return lines;
}

export function doPolygonsIntersect(polygon1: Polygon, polygon2: Polygon): boolean {
    const lines1 = polygonToLines(polygon1);
    const lines2 = polygonToLines(polygon2);
    return lines1.some(line1 => lines2.some(line2 => doLinesIntersect(line1, line2)));
}

export function doRectanglesIntersect(rect1: BoundingBox, rect2: BoundingBox): boolean {
    const polygon1 = rectangleToPolygon(rect1);
    const polygon2 = rectangleToPolygon(rect2);
    return doPolygonsIntersect(polygon1, polygon2);
}

export function checkBoundingBoxCollision(a: BoundingBox, b: BoundingBox): Collision | undefined {
    if (doRectanglesIntersect(a, b)) {
        return {
            position: {
                x: (a.position.x + b.position.x)/2,
                y: (a.position.y + b.position.y)/2
            },
            normal: {
                x: a.position.x - b.position.x,
                y: a.position.y - b.position.y
            },
        }
    }
}