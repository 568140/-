const fs = require('fs');
const filePath = 'src/components/Dashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines preserving of original line endings
const lines = content.split(/\r?\n/);

console.log('Line 3382 starts with:', lines[3381]); // Should be: if (giftType === 'points') {
console.log('Line 3449 starts with:', lines[3448]); // Should be: } else {

if (lines[3381].trim() === "if (giftType === 'points') {" && lines[3448].trim() === "} else {") {
  const replacementLines = `                    if (giftType === 'points') {
                      const amountToAdd = Number(giftPoints);
                      if (isNaN(amountToAdd) || amountToAdd === 0) return;
                      const giftTransaction: Transaction = {
                        id: \`GIFT-\${Date.now()}\`,
                        type: 'deposit',
                        amount: amountToAdd,
                        unit: 'currency',
                        description: 'شحن رصيد إضافي من إدارة المتجر 💰',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: (giftingAccount.balance || 0) + amountToAdd,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم شحن رصيد المحفظة بقيمة \${amountToAdd} ر.س بنجاح! 💰\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'deduct') {
                      const amountToDeduct = Number(giftPoints);
                      if (isNaN(amountToDeduct) || amountToDeduct === 0) return;
                      const currentBalance = giftingAccount.balance || 0;
                      const newBalance = Math.max(0, currentBalance - amountToDeduct);
                      const giftTransaction: Transaction = {
                        id: \`DEDUCT-\${Date.now()}\`,
                        type: 'spend',
                        amount: amountToDeduct,
                        unit: 'currency',
                        description: 'سحب وخصم رصيد يدوي من الإدارة ⚠️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: newBalance,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم خصم \${amountToDeduct} ر.س بنجاح! الرصيد المتبقي: \${newBalance} ر.س 💎\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'reset') {
                      const currentBalance = giftingAccount.balance || 0;
                      const giftTransaction: Transaction = {
                        id: \`RESET-\${Date.now()}\`,
                        type: 'spend',
                        amount: currentBalance,
                        unit: 'currency',
                        description: 'تصفير رصيد المحفظة بالكامل 🗑️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: 0,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم تصفير جميع رصيد المحفظة للعميل بنجاح! 🗑️\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else {`.split('\n');

  // Splice replacementLines into the lines array
  lines.splice(3381, 3449 - 3381, ...replacementLines);
  
  // Join back using original line ending style
  const separator = content.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  fs.writeFileSync(filePath, lines.join(separator), 'utf8');
  console.log('SUCCESS: Spliced lines 3382 to 3449 successfully!');
} else {
  console.error('ERROR: Line values mismatch. Real lines:');
  console.log('Line 3382:', lines[3381]);
  console.log('Line 3449:', lines[3448]);
}
