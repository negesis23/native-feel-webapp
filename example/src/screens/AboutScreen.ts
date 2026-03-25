var NativeCanvas = (window as any).NativeCanvas;
var Box = NativeCanvas.Box;
var Text = NativeCanvas.Text;

import { goHome } from '../main';

export var AboutScreen = function () {
    return Box().flex(1).bg('#1e1e1e')
        .child(
            Box().dir('row').pad(16).gap(16).align('center').bg('#2a2a2a')
                .child(Box().pad(8).radius(20).ripple().onClick(goHome).child(Text("⬅️").sz(24)))
                .child(Text("About Architecture").sz(20).bold().col('white').flex(1))
        )
        .child(
            Box().pad(24).gap(20)
                .child(Text("Clean Framework").sz(24).bold().col('#8ab4f8'))
                .child(Text("• 100% Fluent API (Pipelining)").sz(14).col('#ccc'))
                .child(Text("• Zero Strings, Zero Compilers").sz(14).col('#ccc'))
                .child(Text("• Separated Framework & App Build").sz(14).col('#ccc'))
                .child(Text("• Native Ripple Feedback").sz(14).col('#ccc'))
                .child(Box().bg('#444').pad(12, 24).radius(24).align('center').ripple('rgba(255,255,255,0.1)').onClick(goHome).child(Text("Back to Home").col('white').sz(16)))
        );
};