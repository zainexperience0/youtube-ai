import ReactDOM from 'react-dom';
import App from './App';
import '../assets/css/App.css';

const insertDiv = () => {
  const parent = document.querySelector('div#secondary-inner');
  const child = parent?.querySelector('div#panels');
  if (parent && child && !document.querySelector('#crx-app')) {
    const newDiv = document.createElement('div');
    newDiv.id = 'crx-app';
    parent.insertBefore(newDiv, child);

    ReactDOM.render(<App />, newDiv as HTMLElement);
  }
};

const observeDOMChanges = () => {
  const targetNode = document.querySelector('div#secondary-inner') || document.body; // Prefer specific target if already present
  
  const config = {
    childList: true,
    subtree: true, // Set to true to observe changes inside all descendants
  };

  const callback: MutationCallback = (mutationsList, observer) => {
    const parent = document.querySelector('div#secondary-inner');
    const child = parent?.querySelector('div#panels');
    
    if (parent && child && !document.querySelector('#crx-app')) {
      insertDiv(); // Insert the new div when both target elements exist
      observer.disconnect(); // Stop observing once the target element is found and the div is inserted
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

window.onload = () => {
  if (document.querySelector('div#secondary-inner')) {
    insertDiv(); // Insert immediately if elements already exist on load
  } else {
    observeDOMChanges(); // Start observing only if elements are not yet available
  }
};
