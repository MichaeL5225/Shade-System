import React from 'react';

import {
  BrowserRouter as Router, 
  Routes,                   
  Route                     
} from 'react-router-dom';

import AreaList from './AreaList';   
import EditArea from './EditArea';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AreaList />} />
        <Route path="/edit/:name" element={<EditArea />} />
      </Routes>
    </Router>
  );
}

export default App;
