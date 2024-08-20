const express = require('express');
const axios = require('axios');

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzI0MTY3NDQxLCJpYXQiOjE3MjQxNjcxNDEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjQ1Yzk1N2MwLWU3MDQtNDRkZC05MTY3LTEwZWYwMDgxMGY3ZCIsInN1YiI6InNoYXJzaHZhcmRoYW43NTlAYmJkdS5hYy5pbiJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiNDVjOTU3YzAtZTcwNC00NGRkLTkxNjctMTBlZjAwODEwZjdkIiwiY2xpZW50U2VjcmV0IjoidG9NTmRrbGZMSnJJV256eiIsIm93bmVyTmFtZSI6IkhhcnNoIiwib3duZXJFbWFpbCI6InNoYXJzaHZhcmRoYW43NTlAYmJkdS5hYy5pbiIsInJvbGxObyI6IjEyMTA0MzgwMzIifQ.8B8AsWO82iCw0lBhW5cTKwQ0zKsL4XXI2cRUPi7QM3g';
//If you get Status Code 401, please replace the ACCESS_TOKEN with the new one from the given URL, the code will run fine then : )
const app = express();
const TEST_SERVER_URL = 'http://20.244.56.144/test';
const PORT = process.env.PORT || 9876;
const WINDOW_SIZE = 10;

let windowNumbers = [];

const isValidId = (id) => ['primes', 'fibo', 'even', 'rand'].includes(id);

const fetchNumbersFromTestServer = async (numberId) => {
    try {
      const response = await axios.get(`${TEST_SERVER_URL}/${numberId}`, {
          headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
       });
      if (response.status === 200) {
        console.log(response.data); 
        return response.data.numbers; 
      } else {
        console.log(response.data);
      }
    } catch (error) {
      console.error(`Error fetching numbers from test server: ${error.message}`);
    }
    return [];
  };

const updateWindow = (newNumbers) => {
    if (Array.isArray(newNumbers)) {
      newNumbers.forEach((num) => {
        if (!windowNumbers.includes(num)) {
          if (windowNumbers.length >= WINDOW_SIZE) {
            windowNumbers.shift();
          }
          windowNumbers.push(num);
        }
      });
    } else {
      console.error("newNumbers is not an array", newNumbers);
    }
  };

const calculateAverage = (numbers) => {
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return numbers.length ? sum / numbers.length : 0;
};

app.get('/numbers/:numberId', async (req, res) => {
  const { numberId } = req.params;

  if (!isValidId(numberId)) {
    return res.status(400).json({ error: 'Invalid number ID. Valid IDs are primes, fibo, even, rand.' });
  }

  const previousWindow = [...windowNumbers];
  const newNumbers = await fetchNumbersFromTestServer(numberId);
  updateWindow(newNumbers);

  const average = calculateAverage(windowNumbers);

  return res.json({
    newNumbers,
    previousWindow,
    currentWindow: windowNumbers,
    average,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
