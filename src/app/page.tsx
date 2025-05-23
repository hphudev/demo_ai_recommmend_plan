'use client'

import React, { useRef, useState } from 'react';
import context from './context';

// Define the Todo type
type Todo = {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  time_recommend?: string;
};

const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_API_KEY}`;

// TodoTable component
function TodoTable({ todos, onDelete }: { todos: Todo[]; onDelete: (id: string) => void }) {
  if (todos.length === 0) {
    return (
      <table className="border-collapse min-w-[400px]">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-2">ID</th>
            <th className="border border-gray-300 px-2 py-2">Name</th>
            <th className="border border-gray-300 px-2 py-2">Priority</th>
            <th className="border border-gray-300 px-2 py-2">Description</th>
            <th className="border border-gray-300 px-2 py-2">Suggested time</th>
            <th className="border border-gray-300 px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={6}>
              <div className="ml-6">No todos yet.</div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
  return (
    <table className="border-collapse min-w-[400px]">
      <thead>
        <tr>
          <th className="border border-gray-300 px-2 py-2">#</th>
          <th className="border border-gray-300 px-2 py-2">Name</th>
          <th className="border border-gray-300 px-2 py-2">Priority</th>
          <th className="border border-gray-300 px-2 py-2">Description</th>
          <th className="border border-gray-300 px-2 py-2">Time recommended</th>
          <th className="border border-gray-300 px-2 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {todos.map((todo, index) => (
          <tr key={todo.id}>
            <td className="border border-gray-300 px-2 py-2">{index + 1}</td>
            <td className="border border-gray-300 px-2 py-2">{todo.name}</td>
            <td className="border border-gray-300 px-2 py-2">{todo.priority}</td>
            <td className="border border-gray-300 px-2 py-2">{todo.description}</td>
            <td className="border border-gray-300 px-2 py-2">{todo.time_recommend}</td>
            <td className="border border-gray-300 px-2 py-2">
              <button
                className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition"
                onClick={() => onDelete(todo.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([
    {id: '1', name: 'Housework', description: 'Cooking, cleaning, laundry', priority: 'Medium', time_recommend: '---'},
    {id: '2', name: 'Morning exercise', description: 'Walking and badminton', priority: 'Medium', time_recommend: '---'},
    {id: '3', name: 'Meeting clients', description: 'Coffee, talking and signing contracts, done before 10am.', priority: 'Medium', time_recommend: '---'}
  ]);
  const [loading, setLoading] = useState(false);
  const autoId = useRef(3);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newTodo: Todo = {
      id: (++autoId.current).toString(),
      name: formData.get('name') as string,
      priority: formData.get('priority') as 'High' | 'Medium' | 'Low',
      description: (formData.get('description') as string) || '',
      time_recommend: '---'
    };
    setTodos(prev => [...prev, newTodo]);
    form.reset();
  }

  function handleDelete(id: string) {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  // Recommend plan handler with loading
  function handleRecommendPlan() {
    setLoading(true);
    const data = todos.map(item => ({
      id: item.id,
      name: item.name,
      priority: item.priority,
      description: item.description
    }));

    const contextSend = [...context];
    contextSend.push({
      role: "user",
      parts: [
        { text: JSON.stringify(data) }
      ]
    });

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents: contextSend })
    }).then((res) => {
      res.json().then(data => {
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text as string;
        const arr: string[] = result
          ? result.split(';').map(item => item.trim()).filter(Boolean)
          : [];
        const newTodos = arr.map(item => {
          const tmp = item.split(',');
          const todo = todos.find(todo => todo.id === tmp[0]) as Todo;
          return {
            ...todo,
            time_recommend: tmp[1]
          }
        });
        if (newTodos.length > 0) setTodos([...newTodos]);
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }

  return (
    <div className='text-center pt-[50px]'>
      <h1 className='font-bold'>AI RECOMMENDED TASK ARRANGEMENT</h1>
      {/* <h1 className='font-bold'>(Demo)</h1> */}
      <div className="flex gap-8 items-start justify-center mt-[10%] text-start">
        {/* Todo Form */}
        <form
          className="min-w-[300px] flex flex-col gap-3 border border-gray-300 p-4 rounded-lg bg-white shadow"
          onSubmit={handleSubmit}
          id="todo-form"
        >
          <h2 className="text-xl font-semibold mb-2">Add Todo</h2>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Name</span>
            <input name="name" type="text" required className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Priority</span>
            <select defaultValue={'Medium'} name="priority" required className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
              {/* <option value="">Select</option> */}
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Description</span>
            <textarea name="description" rows={2} className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </label>
          <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition">Add Todo</button>
          <hr/>
          <button
            type="button"
            className="mt-2 bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 transition flex items-center justify-center"
            onClick={handleRecommendPlan}
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            )}
            {loading ? 'Recommending...' : 'Recommended Arrangements'}
          </button>
        </form>

        {/* Todo List Table */}
        <TodoTable todos={todos} onDelete={handleDelete} />
      </div>
    </div>
  );
}
