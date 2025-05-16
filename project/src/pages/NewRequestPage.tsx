import React, { useState } from 'react';

const RequestForm = () => {
  const items = [
    { id: '1', name: 'Training Manual', serials: ['SN-001', 'SN-002'] },
    { id: '2', name: 'Handcuffs', serials: ['HC-100', 'HC-101'] },
    // ...other items
  ];
  const priorities = ['Normal', 'High', 'Urgent'];
  const requestTypes = ['New', 'Repair'];
  const categories = ['Category 1', 'Category 2', 'Category 3'];

  const [requestType, setRequestType] = useState("");
  const [category, setCategory] = useState("");
  const [itemId, setItemId] = useState("");
  const [priority, setPriority] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType || !category || !itemId || !priority || (requestType === 'Repair' && !serialNumber)) {
      alert('Please fill out all fields.');
      return;
    }
    console.log('Form submitted:', { requestType, category, itemId, priority, serialNumber });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setItemId("");
    setSerialNumber("");
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemId(e.target.value);
    setSerialNumber("");
  };

  // Find the selected item to get its serials
  const selectedItem = items.find(item => item.id === itemId);

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
        onChange={handleItemChange}
        required
        disabled={!category}
      >
        <option value="" disabled>Select Item</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>

      {/* Serial Number field for Repair requests */}
      {requestType === 'Repair' && itemId && (
        <>
          <label htmlFor="serialNumber">Serial Number:</label>
          <select
            id="serialNumber"
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
            required
          >
            <option value="" disabled>Select Serial Number</option>
            {(selectedItem?.serials || []).map(sn => (
              <option key={sn} value={sn}>{sn}</option>
            ))}
          </select>
        </>
      )}

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