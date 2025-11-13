const { pool } = require('../../config/database');
const AccountBalanceService = require('../../services/accountBalanceService');

class FixedAssetsController {
    // Get all fixed assets
    async getAllAssets(req, res) {
        try {
            const { asset_type_id, status } = req.query;
            
            let query = `
                SELECT 
                    fa.*,
                    fat.name as asset_type_name,
                    fat.icon as asset_type_icon,
                    coa.code as account_code,
                    coa.name as account_name,
                    u.username as created_by_name
                FROM fixed_assets fa
                JOIN fixed_asset_types fat ON fa.asset_type_id = fat.id
                JOIN chart_of_accounts coa ON fat.chart_of_account_id = coa.id
                LEFT JOIN users u ON fa.created_by = u.id
                WHERE 1=1
            `;
            
            const params = [];
            
            if (asset_type_id) {
                query += ' AND fa.asset_type_id = ?';
                params.push(asset_type_id);
            }
            
            if (status) {
                query += ' AND fa.status = ?';
                params.push(status);
            }
            
            query += ' ORDER BY fa.created_at DESC';
            
            const [assets] = await pool.execute(query, params);
            
            // Parse JSON fields
            assets.forEach(asset => {
                if (asset.custom_fields) {
                    try {
                        asset.custom_fields = typeof asset.custom_fields === 'string' 
                            ? JSON.parse(asset.custom_fields) 
                            : asset.custom_fields;
                    } catch (e) {
                        asset.custom_fields = {};
                    }
                }
                if (asset.attachment_urls) {
                    try {
                        asset.attachment_urls = typeof asset.attachment_urls === 'string' 
                            ? JSON.parse(asset.attachment_urls) 
                            : asset.attachment_urls;
                    } catch (e) {
                        asset.attachment_urls = [];
                    }
                }
            });
            
            res.json({
                success: true,
                data: assets
            });
            
        } catch (error) {
            console.error('Error fetching assets:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch assets',
                details: error.message
            });
        }
    }
    
    // Get single asset
    async getAsset(req, res) {
        try {
            const { id } = req.params;
            console.log('Fetching asset with ID:', id);
            
            const [[asset]] = await pool.execute(`
                SELECT 
                    fa.*,
                    fat.name as asset_type_name,
                    fat.icon as asset_type_icon,
                    fat.requires_registration,
                    fat.requires_serial_number,
                    coa.code as coa_account_code,
                    coa.name as coa_account_name,
                    u.username as created_by_name
                FROM fixed_assets fa
                JOIN fixed_asset_types fat ON fa.asset_type_id = fat.id
                LEFT JOIN chart_of_accounts coa ON fat.chart_of_account_id = coa.id
                LEFT JOIN users u ON fa.created_by = u.id
                WHERE fa.id = ?
            `, [id]);
            
            console.log('Asset found:', asset ? 'Yes' : 'No');
            
            if (!asset) {
                console.log('Asset not found in database');
                return res.status(404).json({
                    success: false,
                    error: 'Asset not found'
                });
            }
            
            // Parse JSON fields
            console.log('Parsing custom_fields...');
            if (asset.custom_fields) {
                try {
                    asset.custom_fields = typeof asset.custom_fields === 'string' 
                        ? JSON.parse(asset.custom_fields) 
                        : asset.custom_fields;
                    console.log('Custom fields parsed successfully');
                } catch (e) {
                    console.log('Error parsing custom_fields:', e.message);
                    asset.custom_fields = {};
                }
            }
            if (asset.attachment_urls) {
                try {
                    asset.attachment_urls = typeof asset.attachment_urls === 'string' 
                        ? JSON.parse(asset.attachment_urls) 
                        : asset.attachment_urls;
                } catch (e) {
                    console.log('Error parsing attachment_urls:', e.message);
                    asset.attachment_urls = [];
                }
            }
            
            // Get payment history
            console.log('Fetching payment history...');
            const [payments] = await pool.execute(`
                SELECT * FROM fixed_asset_payments
                WHERE asset_id = ?
                ORDER BY payment_date DESC
            `, [id]);
            
            console.log('Payments found:', payments.length);
            asset.payments = payments;
            
            // Get depreciation history if applicable
            if (asset.enable_depreciation) {
                const [depreciation] = await pool.execute(`
                    SELECT 
                        fad.*,
                        ap.period_name
                    FROM fixed_asset_depreciation fad
                    JOIN accounting_periods ap ON fad.period_id = ap.id
                    WHERE fad.asset_id = ?
                    ORDER BY fad.depreciation_date DESC
                `, [id]);
                
                asset.depreciation_history = depreciation;
            }
            
            console.log('Sending asset response...');
            res.json({
                success: true,
                data: asset
            });
            
        } catch (error) {
            console.error('ERROR in getAsset:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch asset',
                details: error.message
            });
        }
    }
    
    // Create new asset
    async createAsset(req, res) {
        const conn = await pool.getConnection();
        
        try {
            await conn.beginTransaction();
            
            const {
                asset_type_id,
                asset_name,
                description,
                purchase_date,
                total_cost,
                supplier_name,
                registration_number,
                location,
                serial_number,
                custom_fields,
                enable_depreciation,
                depreciation_method,
                useful_life_years,
                salvage_value,
                is_opening_balance,
                opening_balance_date,
                amount_paid,
                payment_method
            } = req.body;
            
            // Validate
            if (!asset_type_id || !asset_name || !purchase_date || !total_cost) {
                return res.status(400).json({
                    success: false,
                    error: 'Asset type, name, purchase date, and total cost are required'
                });
            }
            
            // Get asset type details
            const [[assetType]] = await conn.execute(`
                SELECT 
                    fat.*,
                    coa.code as account_code,
                    coa.name as account_name
                FROM fixed_asset_types fat
                JOIN chart_of_accounts coa ON fat.chart_of_account_id = coa.id
                WHERE fat.id = ?
            `, [asset_type_id]);
            
            if (!assetType) {
                return res.status(404).json({
                    success: false,
                    error: 'Asset type not found'
                });
            }
            
            // Generate asset code
            const [[lastAsset]] = await conn.execute(
                'SELECT MAX(id) as max_id FROM fixed_assets'
            );
            const nextId = (lastAsset.max_id || 0) + 1;
            const asset_code = `AST-${assetType.name.substring(0, 3).toUpperCase()}-${String(nextId).padStart(5, '0')}`;
            
            const finalCost = parseFloat(total_cost);
            const paidAmount = parseFloat(amount_paid || 0);
            const outstandingBalance = finalCost - paidAmount;
            
            // Get currency
            const [currencies] = await conn.execute(
                'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
            );
            const currency_id = currencies.length > 0 ? currencies[0].id : 1;
            
            let openingBalanceJournalId = null;
            let purchaseJournalId = null;
            
            // Create journal entry for regular asset purchase (if not opening balance)
            if (!is_opening_balance) {
                const refNumber = `AST-${asset_code}`;
                const journalDescription = `Asset Purchase: ${asset_name} - ${assetType.name}`;
                
                // Get or create journal
                let journalId = 6; // Try Fees Journal (ID: 6) first
                const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
                if (journalCheck.length === 0) {
                    const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
                    if (anyJournal.length > 0) {
                        journalId = anyJournal[0].id;
                    } else {
                        const [journalResult] = await conn.execute(
                            'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
                            ['Fees Journal', 'Journal for fee payment transactions', 1]
                        );
                        journalId = journalResult.insertId;
                    }
                }
                
                // Create journal entry
                const [purchaseJournalResult] = await conn.execute(`
                    INSERT INTO journal_entries (
                        journal_id, entry_date, description, reference,
                        created_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [journalId, purchase_date, journalDescription, refNumber, req.user?.id || 1]);
                
                purchaseJournalId = purchaseJournalResult.insertId;
                
                // Get accounts
                const [[cashAccount]] = await conn.execute(
                    'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ?',
                    ['1000', 'Asset'] // Cash on Hand
                );
                
                const [[bankAccount]] = await conn.execute(
                    'SELECT id FROM chart_of_accounts WHERE code = ? AND type = ?',
                    ['1010', 'Asset'] // Bank Account
                );
                
                const [[accountsPayable]] = await conn.execute(
                    'SELECT id FROM chart_of_accounts WHERE code = ?',
                    ['2000'] // Accounts Payable
                );
                
                // Determine payment account based on payment method
                let paymentAccountId = null;
                if (payment_method && paidAmount > 0) {
                    if (payment_method === 'Cash' || payment_method === 'Mobile Money') {
                        paymentAccountId = cashAccount?.id;
                    } else {
                        paymentAccountId = bankAccount?.id;
                    }
                }
                
                // Journal Entry Lines
                // DEBIT: Fixed Asset Account
                await conn.execute(`
                    INSERT INTO journal_entry_lines (
                        journal_entry_id, account_id, debit, credit, description
                    ) VALUES (?, ?, ?, 0, ?)
                `, [purchaseJournalId, assetType.chart_of_account_id, finalCost, `${assetType.name} - ${asset_name}`]);
                
                // CREDIT: Cash/Bank (if paid) or Accounts Payable (if not fully paid)
                if (paidAmount > 0 && paymentAccountId) {
                    // Partially or fully paid - credit cash/bank
                    await conn.execute(`
                        INSERT INTO journal_entry_lines (
                            journal_entry_id, account_id, debit, credit, description
                        ) VALUES (?, ?, 0, ?, ?)
                    `, [purchaseJournalId, paymentAccountId, paidAmount, `Payment for ${asset_name}`]);
                    
                    // If partially paid, also credit accounts payable for the outstanding amount
                    if (outstandingBalance > 0 && accountsPayable) {
                        await conn.execute(`
                            INSERT INTO journal_entry_lines (
                                journal_entry_id, account_id, debit, credit, description
                            ) VALUES (?, ?, 0, ?, ?)
                        `, [purchaseJournalId, accountsPayable.id, outstandingBalance, `Accounts Payable - ${asset_name}`]);
                    }
                } else if (accountsPayable) {
                    // Not paid at all or no payment method - full amount to accounts payable
                    await conn.execute(`
                        INSERT INTO journal_entry_lines (
                            journal_entry_id, account_id, debit, credit, description
                        ) VALUES (?, ?, 0, ?, ?)
                    `, [purchaseJournalId, accountsPayable.id, finalCost, `Accounts Payable - ${asset_name}`]);
                }
                
                // Update account balances
                await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, purchaseJournalId, currency_id);
            }
            
            // Create journal entry for opening balance
            if (is_opening_balance) {
                const refNumber = `OB-${asset_code}`;
                const journalDescription = `Opening Balance: ${asset_name} - ${assetType.name}`;
                
                // Get or create journal for asset payments
                let journalId = 6; // Try Fees Journal (ID: 6) first
                const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
                if (journalCheck.length === 0) {
                    // Try to find any existing journal
                    const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
                    if (anyJournal.length > 0) {
                        journalId = anyJournal[0].id;
                    } else {
                        // Create Fees Journal if no journals exist
                        const [journalResult] = await conn.execute(
                            'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
                            ['Fees Journal', 'Journal for fee payment transactions', 1]
                        );
                        journalId = journalResult.insertId;
                    }
                }
                
                // Create journal entry
                const [journalResult] = await conn.execute(`
                    INSERT INTO journal_entries (
                        journal_id, entry_date, description, reference,
                        created_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `, [journalId, opening_balance_date || purchase_date, journalDescription, refNumber, req.user?.id || 1]);
                
                openingBalanceJournalId = journalResult.insertId;
                
                // Get accounts
                const [[retainedEarnings]] = await conn.execute(
                    'SELECT id FROM chart_of_accounts WHERE code = ?',
                    ['3998']
                );
                
                const [[accountsPayable]] = await conn.execute(
                    'SELECT id FROM chart_of_accounts WHERE code = ?',
                    ['2000']
                );
                
                if (!retainedEarnings) {
                    await conn.rollback();
                    return res.status(500).json({
                        success: false,
                        error: 'Retained Earnings account (3998) not found'
                    });
                }
                
                // Journal Entry Lines
                // DEBIT: Asset Account
                await conn.execute(`
                    INSERT INTO journal_entry_lines (
                        journal_entry_id, account_id, debit, credit, description
                    ) VALUES (?, ?, ?, 0, ?)
                `, [openingBalanceJournalId, assetType.chart_of_account_id, finalCost, `${assetType.name} - ${asset_name}`]);
                
                // CREDIT: Retained Earnings (for amount already paid)
                if (paidAmount > 0) {
                    await conn.execute(`
                        INSERT INTO journal_entry_lines (
                            journal_entry_id, account_id, debit, credit, description
                        ) VALUES (?, ?, 0, ?, ?)
                    `, [openingBalanceJournalId, retainedEarnings.id, paidAmount, 'Retained Earnings - Opening Balance']);
                }
                
                // CREDIT: Accounts Payable (for outstanding balance)
                if (outstandingBalance > 0 && accountsPayable) {
                    await conn.execute(`
                        INSERT INTO journal_entry_lines (
                            journal_entry_id, account_id, debit, credit, description
                        ) VALUES (?, ?, 0, ?, ?)
                    `, [openingBalanceJournalId, accountsPayable.id, outstandingBalance, 'Accounts Payable - Opening Balance']);
                }
                
                // Update account balances
                await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, openingBalanceJournalId, currency_id);
            }
            
            // Create asset record
            const [assetResult] = await conn.execute(`
                INSERT INTO fixed_assets (
                    asset_type_id, asset_code, asset_name, description,
                    purchase_date, total_cost, supplier_name,
                    registration_number, location, serial_number, custom_fields,
                    enable_depreciation, depreciation_method, useful_life_years, salvage_value,
                    amount_paid, outstanding_balance,
                    is_opening_balance, opening_balance_date, opening_balance_journal_id,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                asset_type_id,
                asset_code,
                asset_name,
                description || null,
                purchase_date,
                finalCost,
                supplier_name || null,
                registration_number || null,
                location || null,
                serial_number || null,
                custom_fields ? JSON.stringify(custom_fields) : null,
                enable_depreciation || false,
                enable_depreciation ? (depreciation_method || 'Straight Line') : null,
                enable_depreciation ? useful_life_years : null,
                enable_depreciation ? (salvage_value || 0) : 0,
                paidAmount,
                outstandingBalance,
                is_opening_balance || false,
                is_opening_balance ? (opening_balance_date || purchase_date) : null,
                openingBalanceJournalId,
                req.user?.id || 1
            ]);
            
            const assetId = assetResult.insertId;
            
            await conn.commit();
            
            res.status(201).json({
                success: true,
                message: 'Asset created successfully',
                data: {
                    id: assetId,
                    asset_code,
                    journal_entry_id: purchaseJournalId || openingBalanceJournalId
                }
            });
            
        } catch (error) {
            await conn.rollback();
            console.error('Error creating asset:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create asset',
                details: error.message
            });
        } finally {
            conn.release();
        }
    }
    
    // Make payment on asset
    async makePayment(req, res) {
        const conn = await pool.getConnection();
        
        try {
            await conn.beginTransaction();
            
            const { id } = req.params;
            console.log('Making payment for asset ID:', id);
            console.log('Payment data:', req.body);
            
            const {
                payment_date,
                amount,
                payment_method,
                payment_account_code,
                reference_number,
                description
            } = req.body;
            
            // Validate
            if (!payment_date || !amount || !payment_method) {
                console.log('Validation failed: Missing required fields');
                return res.status(400).json({
                    success: false,
                    error: 'Payment date, amount, and method are required'
                });
            }
            
            // Get asset
            console.log('Fetching asset...');
            const [[asset]] = await conn.execute(`
                SELECT 
                    fa.*,
                    fat.chart_of_account_id,
                    coa.code as account_code,
                    coa.name as account_name
                FROM fixed_assets fa
                JOIN fixed_asset_types fat ON fa.asset_type_id = fat.id
                LEFT JOIN chart_of_accounts coa ON fat.chart_of_account_id = coa.id
                WHERE fa.id = ?
            `, [id]);
            
            console.log('Asset found:', asset ? 'Yes' : 'No');
            
            if (!asset) {
                console.log('Asset not found');
                return res.status(404).json({
                    success: false,
                    error: 'Asset not found'
                });
            }
            
            const paymentAmount = parseFloat(amount);
            console.log('Payment amount:', paymentAmount);
            console.log('Outstanding balance:', asset.outstanding_balance);
            
            if (paymentAmount > asset.outstanding_balance) {
                console.log('Payment exceeds outstanding balance');
                return res.status(400).json({
                    success: false,
                    error: `Payment amount ($${paymentAmount}) exceeds outstanding balance ($${asset.outstanding_balance})`
                });
            }
            
            // Get currency
            console.log('Getting currency...');
            const [currencies] = await conn.execute(
                'SELECT id FROM currencies WHERE base_currency = TRUE LIMIT 1'
            );
            const currency_id = currencies.length > 0 ? currencies[0].id : 1;
            console.log('Currency ID:', currency_id);
            
            // Determine payment account
            let payAccount = payment_account_code || (payment_method === 'Cash' ? '1000' : '1010');
            console.log('Payment account code:', payAccount);
            
            const [[paymentCOA]] = await conn.execute(
                'SELECT id, name FROM chart_of_accounts WHERE code = ?',
                [payAccount]
            );
            console.log('Payment COA found:', paymentCOA ? 'Yes' : 'No');
            
            const [[accountsPayable]] = await conn.execute(
                'SELECT id FROM chart_of_accounts WHERE code = ?',
                ['2000']
            );
            console.log('Accounts Payable found:', accountsPayable ? 'Yes' : 'No');
            
            if (!paymentCOA || !accountsPayable) {
                console.log('Required accounts not found');
                await conn.rollback();
                return res.status(500).json({
                    success: false,
                    error: 'Required accounts not found'
                });
            }
            
            // Check sufficient funds
            console.log('Checking available balance...');
            const [[balance]] = await conn.execute(`
                SELECT COALESCE(balance, 0) as balance
                FROM account_balances
                WHERE account_id = ? AND currency_id = ?
                ORDER BY as_of_date DESC
                LIMIT 1
            `, [paymentCOA.id, currency_id]);
            
            const availableBalance = balance ? parseFloat(balance.balance) : 0;
            console.log('Available balance:', availableBalance);
            
            if (availableBalance < paymentAmount) {
                console.log('Insufficient funds');
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    error: `Insufficient funds in ${paymentCOA.name}. Available: $${availableBalance.toFixed(2)}, Required: $${paymentAmount.toFixed(2)}`
                });
            }
            
            // Create journal entry
            console.log('Creating journal entry...');
            const refNumber = reference_number || `PAY-${asset.asset_code}-${Date.now()}`;
            const journalDescription = `Payment for ${asset.asset_name} - ${description || ''}`;
            
            // Get or create journal for asset payments
            let journalId = 6; // Try Fees Journal (ID: 6) first
            const [journalCheck] = await conn.execute('SELECT id FROM journals WHERE id = ?', [journalId]);
            if (journalCheck.length === 0) {
                // Try to find any existing journal
                const [anyJournal] = await conn.execute('SELECT id FROM journals LIMIT 1');
                if (anyJournal.length > 0) {
                    journalId = anyJournal[0].id;
                } else {
                    // Create Fees Journal if no journals exist
                    const [journalResult] = await conn.execute(
                        'INSERT INTO journals (name, description, is_active) VALUES (?, ?, ?)',
                        ['Fees Journal', 'Journal for fee payment transactions', 1]
                    );
                    journalId = journalResult.insertId;
                }
            }
            
            const [journalResult] = await conn.execute(`
                INSERT INTO journal_entries (
                    journal_id, entry_date, description, reference,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `, [journalId, payment_date, journalDescription, refNumber, req.user?.id || 1]);
            
            const journalEntryId = journalResult.insertId;
            
            // DEBIT: Accounts Payable
            await conn.execute(`
                INSERT INTO journal_entry_lines (
                    journal_entry_id, account_id, debit, credit, description
                ) VALUES (?, ?, ?, 0, ?)
            `, [journalEntryId, accountsPayable.id, paymentAmount, 'Reduce liability']);
            
            // CREDIT: Cash/Bank
            await conn.execute(`
                INSERT INTO journal_entry_lines (
                    journal_entry_id, account_id, debit, credit, description
                ) VALUES (?, ?, 0, ?, ?)
            `, [journalEntryId, paymentCOA.id, paymentAmount, `Payment via ${payment_method}`]);
            
            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
            
            // Record payment
            await conn.execute(`
                INSERT INTO fixed_asset_payments (
                    asset_id, payment_date, amount, payment_method,
                    payment_account_code, reference_number, description,
                    journal_entry_id, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                payment_date,
                paymentAmount,
                payment_method,
                payAccount,
                refNumber,
                description || null,
                journalEntryId,
                req.user?.id || 1
            ]);
            
            // Update asset balances
            const newPaid = parseFloat(asset.amount_paid) + paymentAmount;
            const newOutstanding = parseFloat(asset.outstanding_balance) - paymentAmount;
            
            await conn.execute(`
                UPDATE fixed_assets
                SET amount_paid = ?, outstanding_balance = ?, updated_at = NOW()
                WHERE id = ?
            `, [newPaid, newOutstanding, id]);
            
            await conn.commit();
            
            res.json({
                success: true,
                message: 'Payment recorded successfully',
                data: {
                    journal_entry_id: journalEntryId,
                    reference_number: refNumber,
                    new_paid_amount: newPaid,
                    new_outstanding_balance: newOutstanding
                }
            });
            
        } catch (error) {
            await conn.rollback();
            console.error('ERROR in makePayment:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: 'Failed to process payment',
                details: error.message
            });
        } finally {
            conn.release();
        }
    }
    
    // Update asset details
    async updateAsset(req, res) {
        try {
            const { id } = req.params;
            const {
                asset_name,
                description,
                location,
                registration_number,
                serial_number,
                supplier_name
            } = req.body;

            await pool.execute(`
                UPDATE fixed_assets
                SET 
                    asset_name = ?,
                    description = ?,
                    location = ?,
                    registration_number = ?,
                    serial_number = ?,
                    supplier_name = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                asset_name,
                description,
                location,
                registration_number,
                serial_number,
                supplier_name,
                id
            ]);

            res.json({
                success: true,
                message: 'Asset updated successfully'
            });

        } catch (error) {
            console.error('Error updating asset:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update asset',
                details: error.message
            });
        }
    }
    
    // Get asset summary
    async getAssetSummary(req, res) {
        try {
            const [summary] = await pool.execute(`
                SELECT 
                    fat.name as asset_type,
                    COUNT(fa.id) as count,
                    SUM(fa.total_cost) as total_cost,
                    SUM(fa.amount_paid) as total_paid,
                    SUM(fa.outstanding_balance) as total_outstanding
                FROM fixed_asset_types fat
                LEFT JOIN fixed_assets fa ON fat.id = fa.asset_type_id AND fa.status = 'Active'
                WHERE fat.is_active = 1
                GROUP BY fat.id, fat.name
                ORDER BY fat.name
            `);
            
            res.json({
                success: true,
                data: summary
            });
            
        } catch (error) {
            console.error('Error fetching asset summary:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch asset summary',
                details: error.message
            });
        }
    }
}

module.exports = new FixedAssetsController();

