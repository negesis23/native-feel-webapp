import { MemoryRouter } from '../framework/index';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';

export const appRouter = new MemoryRouter('/');

appRouter.addRoute('/', () => HomeScreen());
appRouter.addRoute('/about', () => AboutScreen());
