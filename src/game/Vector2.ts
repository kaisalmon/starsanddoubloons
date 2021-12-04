export default interface Vector2 {
    x: number;
    y: number;
}

export function dot(a: Vector2, b: Vector2) {
    return a.x * b.x + a.y * b.y;
}

export function getMagnitude(a: Vector2) {
    return Math.sqrt(dot(a, a));
}

export function getNormalized(a: Vector2) {
    const len = getMagnitude(a);
    return {
        x: a.x / len,
        y: a.y / len
    };
}

export function add(a: Vector2, b: Vector2) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}

export function sub(a: Vector2, b: Vector2) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

export function mul(a: Vector2, b: Vector2) {
    return {
        x: a.x * b.x,
        y: a.y * b.y
    };
}

export function div(a: Vector2, b: Vector2) {
    return {
        x: a.x / b.x,
        y: a.y / b.y
    };
}

export function scale(a: Vector2, b: number) {
    return {
        x: a.x * b,
        y: a.y * b
    };
}

export function rotate(a: Vector2, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
        x: a.x * cos - a.y * sin,
        y: a.x * sin + a.y * cos
    };
}

export function distance(a: Vector2, b: Vector2) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(a: Vector2, b: Vector2) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export function getLinearVelocityFromAngularVelocity({
    angularVelocity,
    radius,
    angle
}) {
    return {
        x: angularVelocity * radius * Math.sin(angle + Math.PI / 2),
        y: angularVelocity * radius * Math.cos(angle + Math.PI / 2)
    };
}