/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { TodoList } from './components/TodoList';
import { Filter } from './api/types/Filters';
import { TempTodo } from './components/TempTodo';
import React, { useEffect, useState, useRef } from 'react';

import { Todo } from './api/types/Todo';
import { addTodo, getTodos, deleteTodo, USER_ID } from './api/todos';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const showError = (message: string) => {
    setError(message);

    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      showError('Title should not be empty');

      return;
    }

    setIsAdding(true);

    const newTodo: Todo = {
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo({
      id: 0,
      ...newTodo,
    });

    try {
      const createdTodo = await addTodo(newTodo);

      setTodos(prev => [...prev, createdTodo]);
      setNewTitle('');
    } catch {
      showError('Unable to add a todo');
    } finally {
      setTempTodo(null);
      setIsAdding(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingIds(prev => [...prev, id]);

      await deleteTodo(id);

      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch {
      showError('Unable to delete a todo');
    } finally {
      setDeletingIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleClearCompleted = async () => {
    const completed = todos.filter(todo => todo.completed);

    try {
      await Promise.all(completed.map(todo => deleteTodo(todo.id)));

      setTodos(prev => prev.filter(todo => !todo.completed));
    } catch {
      showError('Error on delete');
    }
  };

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case Filter.Active:
        return !todo.completed;

      case Filter.Completed:
        return todo.completed;

      case Filter.All:
      default:
        return true;
    }
  });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          onSubmit={handleSubmit}
          isAdding={isAdding}
          allCompleted={todos.every(t => t.completed)}
        />

        {(todos.length > 0 || tempTodo) && (
          <section className="todoapp__main" data-cy="TodoList">
            {tempTodo && <TempTodo todo={tempTodo} />}

            <TodoList
              todos={visibleTodos}
              deletingIds={deletingIds}
              onDelete={handleDelete}
            />
          </section>
        )}

        {todos.length > 0 && (
          <Footer
            todos={todos}
            filter={filter}
            setFilter={setFilter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorNotification error={error} onClose={() => setError(null)} />
    </div>
  );
};
