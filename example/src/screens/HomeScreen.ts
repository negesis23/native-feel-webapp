var NativeCanvas = (window as any).NativeCanvas;
var Box = NativeCanvas.Box;
var Text = NativeCanvas.Text;
var Touchable = NativeCanvas.Touchable;
var createSignal = NativeCanvas.createSignal;

import { state } from '../state';
import { goAbout } from '../main';

function Counter(title: string, countSignal: any) {
    var increment = function () { countSignal.value++; };
    var decrement = function () { countSignal.value--; };
    
    return Box().bg('#2a2a2a').pad(16).radius(12).gap(12).align('center')
        .child(Text(title).sz(18).col('#8ab4f8').bold())
        .child(
            Box().dir('row').gap(16).align('center')
            .child(Box().bg('#4A4458').pad(8, 16).radius(20).ripple('rgba(255,255,255,0.1)').whilePressed(300, decrement).child(Text('-').col('white').sz(20)))
            .child(Text(countSignal).sz(24).col('white').bold())
            .child(Box().bg('#8ab4f8').pad(8, 16).radius(20).ripple('rgba(0,0,0,0.1)').whilePressed(300, increment).child(Text('+').col('#1e1e1e').sz(20)))
            );
            }

            export var HomeScreen = function () {
            return Box().flex(1).bg('#1e1e1e')
            .child(
            Box().dir('row').pad(16).gap(16).align('center').bg('#2a2a2a')
                .child(Text("Fluent Canvas UI").sz(20).bold().col('white').flex(1))
                .child(Box().pad(8).radius(20).ripple('rgba(255,255,255,0.2)').onClick(goAbout).child(Text("ℹ️").sz(24)))
            )        .child(
            Box().flex(1).pad(24).gap(16).align('center').justify('center')
                .child(Counter("Global Counter", state.counter))
                .child(Counter("Local Counter", createSignal(10)))
        );
};