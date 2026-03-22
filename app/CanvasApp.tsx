'use client';

import { useEffect, useRef, useState } from 'react';
import { FrameworkEngine } from '../framework/core/engine';
import { Compiler } from '../framework/core/compiler';
import { MemoryRouter } from '../framework/core/router';

const router = new MemoryRouter('/');

export default function CanvasApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FrameworkEngine | null>(null);
  const [currentPath, setCurrentPath] = useState(router.getCurrentTemplate());
  
  const [todos, setTodos] = useState<{id: number, text: string, done: boolean}[]>([
    { id: 1, text: 'Learn Custom Framework', done: false },
    { id: 2, text: 'Build Canvas UI', done: true }
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    return router.subscribe(() => {
      setCurrentPath(router.getCurrentTemplate());
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    const context: Record<string, any> = {
      todos,
      inputValue,
      onInputChange: (val: string) => {
        setInputValue(val);
      },
      addTodo: () => {
        if (inputValue.trim()) {
          setTodos(prev => [...prev, { id: Date.now(), text: inputValue, done: false }]);
          setInputValue('');
        }
      },
      toggleTodo: (id: number) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
      },
      deleteTodo: (id: number) => {
        setTodos(prev => prev.filter(t => t.id !== id));
      },
      goHome: () => {
        router.navigate('/');
      },
      goAbout: () => {
        router.navigate('/about');
      }
    };

    router.addRoute('/', () => `
      <Column flex="1" bg="surface">
        <Row padding="16" gap="16">
          <IconButton id="menuBtn" icon="menu" variant="standard" />
          <Text text="My Tasks" variant="title" flex="1" />
          <IconButton id="infoBtn" icon="info" variant="standard" on-click="goAbout" />
        </Row>
        <Column id="todoList" padding="16" gap="12" flex="1" scrollable="true">
          ${todos.map(t => `
            <Row gap="16" padding="16" bg="surfaceVariant" radius="16">
              <Checkbox id="check_${t.id}" checked="${t.done}" on-change="toggleTodo_${t.id}" />
              <Text text="${t.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" flex="1" variant="body" />
              <IconButton id="del_${t.id}" icon="delete" variant="standard" on-click="deleteTodo_${t.id}" />
            </Row>
          `).join('')}
        </Column>
        <Row padding="16" gap="12" bg="surfaceVariant" align-items="center">
          <TextField id="todoInput" flex="1" placeholder="Add a new task..." bind-value="inputValue" on-change="onInputChange" on-submit="addTodo" />
          <Button id="addBtn" text="Add" variant="filled" icon="add" on-click="addTodo" />
        </Row>
      </Column>
    `);

    router.addRoute('/about', () => `
      <Column flex="1" bg="surface">
        <Row padding="16" gap="16">
          <IconButton id="backBtn" icon="arrow_back" variant="standard" on-click="goHome" />
          <Text text="About Framework" variant="title" flex="1" />
        </Row>
        <Column padding="24" gap="16">
          <Text text="This is a custom, standalone UI framework built from scratch." variant="body" />
          <Text text="It uses a custom XML compiler, a layout engine like Yoga, and Material Design 3 theming." variant="body" />
          <Text text="It renders everything directly to a single HTML Canvas element." variant="body" />
          <Button id="homeBtn" text="Back to Home" variant="tonal" on-click="goHome" />
        </Column>
      </Column>
    `);

    const renderMarkup = () => {
      const markup = router.getCurrentTemplate();

      todos.forEach(t => {
        context[`toggleTodo_${t.id}`] = () => context.toggleTodo(t.id);
        context[`deleteTodo_${t.id}`] = () => context.deleteTodo(t.id);
      });

      const root = Compiler.compile(markup, context);
      
      if (!engineRef.current) {
        engineRef.current = new FrameworkEngine(canvas, root, '#4285F4', true);
      } else {
        engineRef.current.updateRoot(root);
      }
    };

    renderMarkup();

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.visualViewport?.width || window.innerWidth;
      const height = window.visualViewport?.height || window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      
      if (engineRef.current && engineRef.current.focusedComponent) {
        engineRef.current.focusedComponent.needsScrollIntoView = true;
      }
      
      engineRef.current?.requestRender();
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    const handleScroll = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [todos, inputValue, currentPath]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh', touchAction: 'none' }} />;
}
