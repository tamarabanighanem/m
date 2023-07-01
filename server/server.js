
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors"); // Add the cors module
const pool=require("./db")
const app = express();
const port = 5000;



const secretKey = 'a24f41837ef05ad9e52a3794dab8c0055cc7baf383db5d19534454768751a344';

// Test the database connection
pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");

  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL database:", err);
  });

  app.use(express.json({limit:'50mb'}));
  app.use(cors()); // Enable CORS for all routes

app.post('/Register', async (req, res) => {
  const { username, email, password ,domain, address ,role} = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(req.body)
  try {
    const checkEmailSql = 'SELECT * FROM users WHERE email = $1';
    const checkEmailValues = [email];
    const checkEmailResult = await pool.query(checkEmailSql, checkEmailValues);

    if (checkEmailResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const sql = 'INSERT INTO users (username, email, password, domain, address, role) VALUES ($1, $2, $3, $4,$5,$6) RETURNING *';
    const values = [username, email, hashedPassword, domain, address, role];
    const insertResult = await pool.query(sql, values);

    const insertedUserId = insertResult.rows[0].id; // Assuming the 'id' is generated by the database during insertion
    const token = jwt.sign({ id: insertedUserId, username, email ,role,domain, address}, secretKey);
    res.json({ token, message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});


app.post('/Login', (req, res) => {
  const { email, password } = req.body; // Assuming the email and password are provided in the request body

  const sql = 'SELECT * FROM users WHERE email = $1';

  pool.query(
    sql, [email],
    async (error, results) => {
      if (error) {
        return res.status(400).json(error);
      }

      const user = results.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {

        return res.status(401).send("incorrect email or password");
      }
      else {
        const token = jwt.sign({ id: user.id, username: user.username,role:user.role, email: user.email }, secretKey);
        res.json({ token: token, message: 'User registered successfully' });
      }
    }
  );

});


app.get("/checkToken", authenticateToken, (req, res) => {
  res.send(req.user);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization.trim()
  console.log(authHeader)
  const token = authHeader 

  if (!token) {
    console.log("/////////////////////////////////////////////////////")

    return res.status(401).json({ error: "Not found" });
    
  }

  jwt.verify(token,secretKey, (err, decoded) => {
    console.log( secretKey)
    if (err) {
      console.log("***************************************")

      return res.status(403).json({ error: "Invalid" });

    }
   console.log(decoded)
    req.user = decoded;
    next();
  });
}
///////////////////////////////////////request of user
app.post("/request", (req, res) => {
  const {user_id, mkhiata_id,description , phone ,photo} = req.body;
  console.log(user_id, mkhiata_id,description , phone ,photo);
  pool.query(
    "INSERT INTO request(user_id, mkhiata_id,description , phone ,photo) VALUES($1,$2,$3,$4,$5) RETURNING*",
    [user_id, mkhiata_id,description , phone ,photo],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {

        res.status(201).send(result.rows);
      }
    }
  );
});
///////////////////////////////////////Product of makhiata 
      

app.post("/product", (req, res) => {
  // const { name, description, price, product_id, photo } = req.body;
  const { name, description, price, user_id,photo} = req.body;

  pool.query(
    "INSERT INTO products(name, description, price, user_id,photo) VALUES($1, $2, $3, $4, $5) RETURNING *",

    // [name, description, price, product_id, photo],
    [name, description, price, user_id,photo],

    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.status(201).send(result.rows);
      }
    }
  );
});



app.get('/profileProvider/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    console.log(user)
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});




app.get('/profileUser/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    console.log(user)
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
//////////////////////all Product for mkhiata in profile

app.get('/productOfMakhiata/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
  
    
    const user = await pool.query("SELECT * FROM products WHERE user_id = $1 AND active = true", [id]);
    console.log(user)
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
//////////////////////all request for mkhiata in profile

app.get('/requestOfMakhiata/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
  
    
    const user = await pool.query("SELECT * FROM request WHERE mkhiata_id = $1", [id]);
    console.log(user)
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
/////////give all makhaiet
app.get('/stitched', async function (req, res) {
  try {
    // const { id } = req.params;
    // console.log(id);
    const user = await pool.query("SELECT * FROM users where role= 'مخيطة'");
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
  

///////////////////////تصاميم كل مخيطة

app.get('/productCollection/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const user = await pool.query('SELECT * FROM products WHERE user_id = $1 AND active = true', [id]);
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

////////////////////////////تفاصيل كل قطعه
app.get('/eachproduct/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const user = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});
// app.get("/resort", (req, res) => {
//   const q = "SELECT * FROM resort where active = true "
//   pool.query(q, (err, data) => {
//     if (err) return res.json(err)
//     return res.json(data.rows)
//   })
// })

/////////////////////editprofileprovider

app.put(`/editprofileProvirer/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, address, domain } = req.body;
    console.log(username, address, domain);
  

    const updated = await pool.query(
      'UPDATE users SET username = $1, address = $2, domain = $3 WHERE id = $4',
      [username, address, domain,id]
    );

    console.log(updated);

    res.json(updated.rows);
  
  } catch (error) {
    res.status(500).json({ error: "Can't edit data" });
  }
});

/////////////////////editproduct
app.put(`/editproduct/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, photo } = req.body;
    console.log(name, description, price, photo);

    const updated = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, photo = $4 WHERE id = $5',
      [name, description, price, photo, id]
    );

    console.log(updated);

    res.json(updated.rows);

  } catch (error) {
    res.status(500).json({ error: "Can't edit data" });
  }
});
////////////////////////productDetails

app.get('/productDetails/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    res.json(product.rows[0]); // Assuming there is only one product with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching product data' });
  }
});


////////////////////////////طلب كل مستخدم
app.get('/requestOfeachuser/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const user = await pool.query('SELECT * FROM request WHERE user_id = $1', [id]);
    res.json(user.rows); // Assuming there is only one user with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

//////////delete request from user profile
app.delete("/request/:id", (req, res) => {
  const resortid = req.params.id;
  const q = "DELETE FROM request WHERE id = $1"
  pool.query(q, [resortid], (err, data) => {
    if (err) return res.json(err)
    return res.json("resort has been deleted successfully")
  })
})

///////////////////////////////////////Product of makhiata 
      

app.post("/payment", (req, res) => {
  const {card_number,cvv,cardholder,product_id,user_id,provider_id, expiration_date} = req.body;

  pool.query(
    "INSERT INTO payment(card_number,cvv,cardholder,product_id,user_id,provider_id, expiration_date) VALUES($1, $2, $3, $4, $5,$6,$7) RETURNING *",
    [card_number,cvv,cardholder,product_id,user_id,provider_id, expiration_date],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.status(201).send(result.rows);
      }
    }
  );
});


/////////////////////editrequest
app.put('/editrequest/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description,phone, photo } = req.body;
    console.log(description, phone ,photo);

    const updated = await pool.query(
      'UPDATE request SET description = $1, phone = $2, photo = $3 WHERE id = $4',
      [description, phone ,photo,id]
    );

    console.log(updated);

    res.json(updated.rows);
  } catch (error) {
    res.status(500).json({ error: "Can't edit data" });
  }
});

///////////////////requestDetails
app.get('/requestDetails/:id', async function (req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    const product = await pool.query('SELECT * FROM request WHERE id = $1', [id]);
    res.json(product.rows[0]); // Assuming there is only one product with the given ID
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'An error occurred while fetching product data' });
  }
});
///////////////////////////dasssshhhpooooordddddddddd

app.get("/allusers", async (req, res) => {
  const data = await pool.query("SELECT * FROM users;");

  try {
    res.status(200).json({
      status: "success",
      data: {
        "users-count": data.rows.length,
        users: data.rows,
      },
    });
    console.log(data);
  } catch (err) {
    res.status(400).json(err.message);
    console.log(err);
  }
});


// Delete a user from the "users" table
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = "DELETE FROM users WHERE id = $1";
    await pool.query(query, [id]);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "An error occurred while deleting the user" });
  }
});



////////////////tesssstresort
app.get("/pending-product", async (req, res) => {
  const data = await pool.query("SELECT * FROM products WHERE active = false;");
  try {
    res.status(200).json({
      status: "success",
      data: {
        "resorts-count": data.rows.length,
        resorts: data.rows,
      },
    });
    console.log(data);
  } catch (err) {
    res.status(400).json(err.message);
    console.log(err);
  }
});


app.delete("/resorts/:id", async (req, res) => {
  const data = await pool.query(`DELETE FROM products WHERE id = $1;`, [
    req.params.id,
  ]);

  const resorts = await pool.query(
    `SELECT * FROM products WHERE active = false;`
  );

  try {
    res.status(200).json({
      status: "success",
      data: {
        "users-count": resorts.rows.length,
        resorts: resorts.rows,
      },
    });
  } catch (err) {
    res.status(400).json(err.message);
  }
});





app.post("/resorts/:id", async (req, res) => {
  const data = await pool.query(
    `UPDATE products SET active = true WHERE id = $1;`,
    [req.params.id]
  );

  const resorts = await pool.query(
    `SELECT * FROM products WHERE active = false;`
  );
  try {
    res.status(200).json({
      status: "success",
      data: {
        "resorts-count": resorts.rows.length,
        resorts: resorts.rows,
      },
    });
  } catch (err) {
    res.status(400).json(err.message);
  }
});
//////////////delete from profile provider
// delete aresort
app.delete("/product/:id", (req, res) => {
  const resortid = req.params.id;
  const q = "DELETE FROM products WHERE id = $1"
  pool.query(q, [resortid], (err, data) => {
    if (err) return res.json(err)
    return res.json("resort has been deleted successfully")
  })
})

////payment
app.get("/api/payments", async (req, res) => {
  const data = await pool.query("SELECT * FROM payments ");
  try {
    res.status(200).json({
      status: "success",
      data: {
        "resorts-count": data.rows.length,
        resorts: data.rows,
      },
    });
    console.log(data);
  } catch (err) {
    res.status(400).json(err.message);
    console.log(err);
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});






