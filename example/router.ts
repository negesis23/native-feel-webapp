var NativeCanvas = (window as any).NativeCanvas;
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';

export var appRouter = new NativeCanvas.MemoryRouter('/');
appRouter.addRoute('/', function() { return HomeScreen(); });
appRouter.addRoute('/about', function() { return AboutScreen(); });
