import React, { useState } from 'react';
import './App.css';

function App() {
  const[open,setOpen] = useState(false);
  const toggleDropDown = ()=>{
    setOpen(!open);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Hello welcome to Shade System!
        </p>
        <div className = "test"> 
          <button className ="btn"> 
            click me ! 
          </button>

          <div className = "dropdown"> 
            <button className = "dropbtn" onClick={toggleDropDown}> 
              פעולות נוספות
            </button>
          {open && (
            <div className = "dropdown-content">
              <a href="#">area 1</a>
              <a href="#">area 2</a>
              <a href="#">area 3</a>
            </div>
          )}
          </div>
        </div>
          
        
      </header>
    </div>
  );
}

export default App;
