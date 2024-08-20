const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 9876;
const CACHE_TTL = 300; // Cache for 5 minutes
const PRODUCTS_PER_PAGE = 10;
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzI0MTY3NDQxLCJpYXQiOjE3MjQxNjcxNDEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjQ1Yzk1N2MwLWU3MDQtNDRkZC05MTY3LTEwZWYwMDgxMGY3ZCIsInN1YiI6InNoYXJzaHZhcmRoYW43NTlAYmJkdS5hYy5pbiJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiNDVjOTU3YzAtZTcwNC00NGRkLTkxNjctMTBlZjAwODEwZjdkIiwiY2xpZW50U2VjcmV0IjoidG9NTmRrbGZMSnJJV256eiIsIm93bmVyTmFtZSI6IkhhcnNoIiwib3duZXJFbWFpbCI6InNoYXJzaHZhcmRoYW43NTlAYmJkdS5hYy5pbiIsInJvbGxObyI6IjEyMTA0MzgwMzIifQ.8B8AsWO82iCw0lBhW5cTKwQ0zKsL4XXI2cRUPi7QM3g';
const TEST_SERVER_URL = 'http://20.244.56.144/test';
const companies = ['AM', 'FLP', 'SNP', 'HYNT', 'AZO'];

const cache = new NodeCache({ stdTTL: CACHE_TTL });

async function getProducts(company, category, minPrice, maxPrice) {
  const url = `${TEST_SERVER_URL}/${company}/categories/${category}/products`;
  const params = { minPrice: minPrice || 0, maxPrice: maxPrice || 10000 };

  try {
    const response = await axios.get(url, { params });
    return response.data; 
  } catch (error) {
    console.error(`Error fetching products from ${company}:`, error.message);
    return [];
  }
}

async function getProductById(company, category, productId) {
  const url = `${TEST_SERVER_URL}/${company}/categories/${category}/products/${productId}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId} from ${company}:`, error.message);
    return null;
  }
}

async function getCachedTopProducts(category, n, minPrice, maxPrice) {
  const cacheKey = `${category}_${n}_${minPrice}_${maxPrice}`;
  let products = cache.get(cacheKey);

  if (!products) {
    const productPromises = companies.map(company => getProducts(company, category, minPrice, maxPrice));
    const productsFromAllCompanies = (await Promise.all(productPromises)).flat();
    productsFromAllCompanies.sort((a, b) => a.price - b.price);
    products = productsFromAllCompanies.slice(0, n);
    cache.set(cacheKey, products);
  }

  return products;
}

// GET /categories/:categoryName/products
app.get('/categories/:categoryName/products', async (req, res) => {
  const { categoryName } = req.params;
  const { n = 10, page = 1, minPrice, maxPrice } = req.query;
  const products = await getCachedTopProducts(categoryName, parseInt(n), minPrice, maxPrice);

  const paginatedProducts = products.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  res.json({
    page: page,
    totalPages: Math.ceil(products.length / PRODUCTS_PER_PAGE),
    products: paginatedProducts,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
