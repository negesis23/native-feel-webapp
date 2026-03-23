import { MemoryRouter } from '../framework/index';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
export var appRouter = new MemoryRouter('/');
appRouter.addRoute('/', function () { return HomeScreen(); });
appRouter.addRoute('/about', function () { return AboutScreen(); });
