const fs = require('fs');
const filePath = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to avoid CRLF mismatch troubles
const normalizedContent = content.replace(/\r\n/g, '\n');

const startStr = "if (giftType === 'points') {";
const startIdx = normalizedContent.indexOf(startStr);

if (startIdx !== -1) {
  // Let's find with LF sequence
  const targetEndSeq = "setGiftSuccessMsg(null);\n                      }, 2500);\n                    } else {";
  const endIdx = normalizedContent.indexOf(targetEndSeq, startIdx);
  const lengthToCut = targetEndSeq.length;
  
  if (endIdx !== -1) {
    const replacement = `if (giftType === 'points') {
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
                    } else {`;
    
    const result = normalizedContent.substring(0, startIdx) + replacement + normalizedContent.substring(endIdx + lengthToCut);
    
    // Convert back to CRLF only if the original content had carriage returns
    const finalContent = content.indexOf('\r\n') !== -1 ? result.replace(/\n/g, '\r\n') : result;
    
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('SUCCESS: Handlers updated correctly via index range matching!');
  } else {
    console.error('ERROR: Could not find targetEndSeq after startIdx.');
  }
} else {
  console.error('ERROR: Could not locate startStr.');
}
