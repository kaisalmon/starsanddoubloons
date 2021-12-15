import Vector2, { rotate } from "./Vector2";

export default interface Collision {
    position: Vector2;
    normal: Vector2;
    momentum: number;
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

/*
// Given three collinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
bool onSegment(Point p, Point q, Point r)
{
    if (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
        q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y))
       return true;
 
    return false;
}
*/

function onSegment(p: Vector2, q:Vector2, r:Vector2): boolean {
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)){
            return true;
    }
    return false
}

/*
// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise

*/

function orientation(p:Vector2, q:Vector2, r: Vector2){
    const val = (q.y - p.y) * (r.x - q.x) -
                (q.x - p.x) * (r.y - q.y);
    if (val === 0) {
        return 0;
    }
    return (val > 0)? 1: 2;
}

/*

    // Find the four orientations needed for general and
    // special cases
    int o1 = orientation(p1, q1, p2);
    int o2 = orientation(p1, q1, q2);
    int o3 = orientation(p2, q2, p1);
    int o4 = orientation(p2, q2, q1);
 
    // General case
    if (o1 != o2 && o3 != o4)
        return true;
 
    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
 
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
 
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
 
     // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
 
    return false; // Doesn't fall in any of the above cases
    */
function doLinesIntersect(line1: Line, line2: Line): boolean {
    const [p1, q1] = line1;
    const [p2, q2] = line2;
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);
    if (o1 !== o2 && o3 !== o4) {
        return true;
    }
    if (o1 === 0 && onSegment(p1, p2, q1)) {
        return true;
    }
    if (o2 === 0 && onSegment(p1, q2, q1)) {
        return true;
    }
    if (o3 === 0 && onSegment(p2, p1, q2)) {
        return true;
    }
    if (o4 === 0 && onSegment(p2, q1, q2)) {
        return true;
    }
    return false;  
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
