"use strict";
(function() {
  // src/state.ts
  var NativeCanvas = window.NativeCanvas;
  var state = {
    counter: NativeCanvas.createSignal(0)
  };

  // src/screens/HomeScreen.ts
  var NativeCanvas2 = window.NativeCanvas;
  var Box = NativeCanvas2.Box;
  var Text = NativeCanvas2.Text;
  var Touchable = NativeCanvas2.Touchable;
  var createSignal = NativeCanvas2.createSignal;
  function Counter(title, countSignal) {
    var increment = function() {
      countSignal.value++;
    };
    var decrement = function() {
      countSignal.value--;
    };
    return Box().bg("#2a2a2a").pad(16).radius(12).gap(12).align("center").child(Text(title).sz(18).col("#8ab4f8").bold()).child(
      Box().dir("row").gap(16).align("center").child(Box().bg("#4A4458").pad(8, 16).radius(20).ripple("rgba(255,255,255,0.1)").whilePressed(300, decrement).child(Text("-").col("white").sz(20))).child(Text(countSignal).sz(24).col("white").bold()).child(Box().bg("#8ab4f8").pad(8, 16).radius(20).ripple("rgba(0,0,0,0.1)").whilePressed(300, increment).child(Text("+").col("#1e1e1e").sz(20)))
    );
  }
  var HomeScreen = function() {
    return Box().flex(1).bg("#1e1e1e").child(
      Box().dir("row").pad(16).gap(16).align("center").bg("#2a2a2a").child(Text("Fluent Canvas UI").sz(20).bold().col("white").flex(1)).child(Box().pad(8).radius(20).ripple("rgba(255,255,255,0.2)").onClick(goAbout).child(Text("\u2139\uFE0F").sz(24)))
    ).child(
      Box().flex(1).pad(24).gap(16).align("center").justify("center").child(Counter("Global Counter", state.counter)).child(Counter("Local Counter", createSignal(10)))
    );
  };

  // src/screens/AboutScreen.ts
  var NativeCanvas3 = window.NativeCanvas;
  var Box2 = NativeCanvas3.Box;
  var Text2 = NativeCanvas3.Text;
  var AboutScreen = function() {
    return Box2().flex(1).bg("#1e1e1e").child(
      Box2().dir("row").pad(16).gap(16).align("center").bg("#2a2a2a").child(Box2().pad(8).radius(20).ripple().onClick(goHome).child(Text2("\u2B05\uFE0F").sz(24))).child(Text2("About Architecture").sz(20).bold().col("white").flex(1))
    ).child(
      Box2().pad(24).gap(20).child(Text2("Clean Framework").sz(24).bold().col("#8ab4f8")).child(Text2("\u2022 100% Fluent API (Pipelining)").sz(14).col("#ccc")).child(Text2("\u2022 Zero Strings, Zero Compilers").sz(14).col("#ccc")).child(Text2("\u2022 Separated Framework & App Build").sz(14).col("#ccc")).child(Text2("\u2022 Native Ripple Feedback").sz(14).col("#ccc")).child(Box2().bg("#444").pad(12, 24).radius(24).align("center").ripple("rgba(255,255,255,0.1)").onClick(goHome).child(Text2("Back to Home").col("white").sz(16)))
    );
  };

  // src/router.ts
  var NativeCanvas4 = window.NativeCanvas;
  var appRouter = new NativeCanvas4.MemoryRouter("/");
  appRouter.addRoute("/", function() {
    return HomeScreen();
  });
  appRouter.addRoute("/about", function() {
    return AboutScreen();
  });

  // src/main.ts
  var NativeCanvas5 = window.NativeCanvas;
  var canvas = document.getElementById("app");
  document.body.style.backgroundColor = "#1e1e1e";
  var app = new NativeCanvas5.FrameworkApp({
    canvas: canvas,
    router: appRouter
  });
  function goHome() {
    appRouter.navigate("/");
  }
  function goAbout() {
    appRouter.navigate("/about");
  }
  app.start();
})();
