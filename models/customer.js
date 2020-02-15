/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");


/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /** returns first and last name of customer */

  fullName() {
    const fullName = `${this.firstName} ${this.lastName}`;
    return fullName;
  }

  /** finds the customer using first and last name */

  static async search(searchTerm) {

    // Uppercases first letter of first name and last name
    let words = searchTerm.search.split(" ");

    let firstNameLetters = words[0].split("");
    firstNameLetters[0] = firstNameLetters[0].toUpperCase();
    let firstName = firstNameLetters.join("");
    
    let lastNameLetters = words[1].split("");
    lastNameLetters[0] = lastNameLetters[0].toUpperCase();
    let lastName = lastNameLetters.join("");


    const result = await db.query(
      `SELECT id FROM customers
      WHERE first_name = $1 AND last_name=$2 `,
      [firstName, lastName]
    );

    return result.rows[0].id;
  }

  // finds top ten customers who make the most reservations
  // returns top then customers as instances

  static async topTen(){

    const result = await db.query(
      `SELECT c.id, c.first_name AS "firstName", c.last_name AS "lastName", c.phone, c.notes, r.customer_id, COUNT(*)
       FROM reservations r
       JOIN customers c
       ON c.id = r.customer_id
       GROUP BY c.first_name, c.last_name, c.id, r.customer_id
       ORDER BY COUNT DESC
       LIMIT 10`
    )

    return result.rows.map(c => new Customer(c));
  }
}

module.exports = Customer;
