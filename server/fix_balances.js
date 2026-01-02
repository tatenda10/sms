const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

async function fixBalances() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Get all students with balance records
        const [students] = await connection.execute('SELECT student_reg_number FROM student_balances');
        console.log(`Processing ${students.length} students...`);

        for (const student of students) {
            const reg = student.student_reg_number;

            // Get all transactions
            const [transactions] = await connection.execute(
                'SELECT transaction_type, amount FROM student_transactions WHERE student_reg_number = ?',
                [reg]
            );

            let totalBalance = 0;
            for (const tx of transactions) {
                const amt = parseFloat(tx.amount);
                if (tx.transaction_type === 'CREDIT') {
                    totalBalance += amt;
                } else {
                    totalBalance -= amt;
                }
            }

            // Update balance
            await connection.execute(
                'UPDATE student_balances SET current_balance = ?, last_updated = NOW() WHERE student_reg_number = ?',
                [totalBalance, reg]
            );
            console.log(`Fixed ${reg}: ${totalBalance}`);
        }

        console.log('Balance recovery complete');
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}

fixBalances();
