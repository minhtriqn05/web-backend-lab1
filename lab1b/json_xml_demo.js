// json_xml_demo.js - Handling JSON and XML data in Node.js
// Step 1: Import modules
const fs = require('fs');
const xml2js = require('xml2js');

// Step 2: Create a JavaScript object
const productData = {
  id: "PROD-1001",
  name: "Sony WH-1000XM5 Bluetooth Headphones",
  price: 8500000,
  inStock: true,
  categories: ["Audio", "Electronics", "Wireless"],
  supplier: {
    name: "Sony Vietnam",
    contact: "support@sony.com.vn"
  }
};

// Step 3: Convert the JS object to JSON format
const jsonString = JSON.stringify(productData, null, 2);
console.log("=== 1. FORMATTED JSON STRING ===");
console.log(jsonString);

// Write the JSON to product.json
fs.writeFileSync('product.json', jsonString, 'utf8');

// Step 4: Convert the JS object to XML format
const builder = new xml2js.Builder({ rootName: 'Product' });
const xmlData = builder.buildObject(productData);
console.log("\n=== 2. CONVERTED TO XML FORMAT ===");
console.log(xmlData);

// Write the XML to product.xml
fs.writeFileSync('product.xml', xmlData, 'utf8');

// Step 5: Read the XML file and parse it back into a JS object (xml2js parser)
fs.readFile('product.xml', 'utf8', (err, data) => {
  if (err) throw err;
  xml2js.parseString(data, { explicitArray: false }, (err, result) => {
    if (err) throw err;
    console.log("\n=== 3. XML FILE PARSED BACK INTO A JS OBJECT ===");
    console.log(result.Product);
    console.log(`Parsed product name: ${result.Product.name}`);

    // ===== EXTENDED REQUIREMENT =====
    console.log("\n=== 4. EXTENDED: validateAndMerge() ===");
    // Case 1: valid price -> product_final.json is created
    validateAndMerge('product.json');

    // Case 2: invalid price (negative) -> rejected, nothing is written
    const invalidProduct = { ...productData, id: "PROD-1002", price: -500000 };
    fs.writeFileSync('product_invalid.json', JSON.stringify(invalidProduct, null, 2), 'utf8');
    validateAndMerge('product_invalid.json');
  });
});

/**
 * EXTENDED REQUIREMENT
 * 1. Read the JSON file at jsonPath.
 * 2. Check that price is a positive number (> 0). If valid, add discountPrice (10% off).
 * 3. Write the merged object out to product_final.json.
 */
function validateAndMerge(jsonPath) {
  // 1. Read the JSON file that was just written
  const product = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 2. Validate the price field
  const price = product.price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    console.log(`[validateAndMerge] ${jsonPath}: INVALID price (${price}) - price must be a positive number > 0. Skipped.`);
    return null;
  }
  const merged = { ...product, discountPrice: Math.round(price * 0.9) };

  // 3. Write the merged object to product_final.json
  fs.writeFileSync('product_final.json', JSON.stringify(merged, null, 2), 'utf8');
  console.log(`[validateAndMerge] ${jsonPath}: price is valid -> discountPrice = ${merged.discountPrice}`);
  console.log("[validateAndMerge] Merged object written to product_final.json:");
  console.log(merged);
  return merged;
}
