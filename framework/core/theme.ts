export function generateTheme(seedColorHex, isDark) {
    var r = parseInt(seedColorHex.slice(1, 3), 16) / 255;
    var g = parseInt(seedColorHex.slice(3, 5), 16) / 255;
    var b = parseInt(seedColorHex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    var hsl = function (h, s, l) { return "hsl(".concat(h, ", ").concat(s, "%, ").concat(l, "%)"); };
    if (isDark) {
        return {
            primary: hsl(h, 80, 80),
            onPrimary: hsl(h, 100, 20),
            primaryContainer: hsl(h, 70, 30),
            onPrimaryContainer: hsl(h, 90, 90),
            secondary: hsl(h, 30, 70),
            onSecondary: hsl(h, 50, 20),
            secondaryContainer: hsl(h, 30, 30),
            onSecondaryContainer: hsl(h, 50, 90),
            surface: hsl(h, 10, 10),
            onSurface: hsl(h, 10, 90),
            surfaceVariant: hsl(h, 15, 20),
            onSurfaceVariant: hsl(h, 15, 80),
            outline: hsl(h, 10, 60),
            outlineVariant: hsl(h, 10, 30),
            background: hsl(h, 10, 10),
            onBackground: hsl(h, 10, 90),
            error: hsl(0, 80, 80),
            onError: hsl(0, 100, 20),
        };
    }
    else {
        return {
            primary: hsl(h, 80, 40),
            onPrimary: hsl(h, 100, 100),
            primaryContainer: hsl(h, 90, 90),
            onPrimaryContainer: hsl(h, 100, 10),
            secondary: hsl(h, 30, 40),
            onSecondary: hsl(h, 100, 100),
            secondaryContainer: hsl(h, 50, 90),
            onSecondaryContainer: hsl(h, 100, 10),
            surface: hsl(h, 10, 98),
            onSurface: hsl(h, 10, 10),
            surfaceVariant: hsl(h, 15, 90),
            onSurfaceVariant: hsl(h, 15, 30),
            outline: hsl(h, 10, 50),
            outlineVariant: hsl(h, 10, 80),
            background: hsl(h, 10, 98),
            onBackground: hsl(h, 10, 10),
            error: hsl(0, 80, 40),
            onError: hsl(0, 100, 100),
        };
    }
}
