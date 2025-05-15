import React, { useState } from 'react';

const RequestForm = () => {
  const items = [
    { id: '1', name: 'Training Manual' },
    // ...other items
  ];
  const priorities = ['Normal', 'High', 'Urgent'];
  const requestTypes = ['Type A', 'Type B', 'Type C']; // Example request types
  const categories = ['Category 1', 'Category 2', 'Category 3']; // Example categories

  // Set initial state to empty string for each select
  const [requestType, setRequestType] = useState("");
  const [category, setCategory] = useState("");
  const [itemId, setItemId] = useState("");
  const [priority, setPriority] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType || !category || !itemId || !priority) {
      alert('Please fill out all fields.');
      return;
    }
    console.log('Form submitted:', { requestType, category, itemId, priority });
  };

  // When the category changes, reset itemId to ""
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setItemId("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="requestType">Request Type:</label>
      <select
        id="requestType"
        value={requestType}
        onChange={e => setRequestType(e.target.value)}
        required
      >
        <option value="" disabled>Select Request Type</option>
        {requestTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <label htmlFor="category">Category:</label>
      <select
        id="category"
        value={category}
        onChange={handleCategoryChange}
        required
      >
        <option value="" disabled>Select Category</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <label htmlFor="item">Item:</label>
      <select
        id="item"
        value={itemId}
        onChange={e => setItemId(e.target.value)}
        required
        disabled={!category}
      >
        <option value="" disabled>Select Item</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>

      <label htmlFor="priority">Priority:</label>
      <select
        id="priority"
        value={priority}
        onChange={e => setPriority(e.target.value)}
        required
      >
        <option value="" disabled>Select Priority</option>
        {priorities.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <button type="submit">Submit</button>
    </form>
  );
};

export default RequestForm;