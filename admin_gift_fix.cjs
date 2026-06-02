const fs = require('fs');
const filePath = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// For line endings resilience, let's normalize to LF before making edits, or use Regex
const oldCode = `                    if (giftType === 'points') {
                      const pointsToAdd = Number(giftPoints);
                      if (isNaN(pointsToAdd) || pointsToAdd === 0) return;
                      const giftTransaction: Transaction = {
                        id: \`GIFT-\${Date.now()}\`,
                        type: 'deposit',
                        amount: pointsToAdd,
                        unit: 'points',
                        description: 'هدية خاصة (نقاط) من إدارة المتجر 🎁',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        points: (giftingAccount.points || 0) + pointsToAdd,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم إهداء \${pointsToAdd} نقطة بنجاح! 🎁\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'deduct') {
                      const pointsToDeduct = Number(giftPoints);
                      if (isNaN(pointsToDeduct) || pointsToDeduct === 0) return;
                      const currentPoints = giftingAccount.points || 0;
                      const newPoints = Math.max(0, currentPoints - pointsToDeduct);
                      const giftTransaction: Transaction = {
                        id: \`DEDUCT-\${Date.now()}\`,
                        type: 'spend',
                        amount: pointsToDeduct,
                        unit: 'points',
                        description: 'خصم نقاط يدوياً من إدارة المتجر ⚠️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        points: newPoints,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم خصم \${pointsToDeduct} نقطة بنجاح! الرصيد المتبقي: \${newPoints} 💎\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'reset') {
                      const currentPoints = giftingAccount.points || 0;
                      const giftTransaction: Transaction = {
                        id: \`RESET-\${Date.now()}\`,
                        type: 'spend',
                        amount: currentPoints,
                        unit: 'points',
                        description: 'تصفير نقاط الحساب بالكامل 🗑️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        points: 0,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(\`تم تصفير جميع نقاط العميل بنجاح! 🗑️\`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);`;

const newCode = `                    if (giftType === 'points') {
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
                      }, 2500);`;

const normalizedOld = oldCode.replace(/\r\n/g, '\n').trim();
const normalizedNew = newCode.replace(/\r\n/g, '\n').trim();
const normalizedContent = content.replace(/\r\n/g, '\n');

if (normalizedContent.indexOf(normalizedOld) !== -1) {
  const result = normalizedContent.replace(normalizedOld, normalizedNew);
  // Write back with local OS line-endings preservation (CRLF if original had CRLF)
  const finalContent = content.indexOf('\r\n') !== -1 ? result.replace(/\n/g, '\r\n') : result;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log('SUCCESS: Admin gift submit handler updated successfully!');
} else {
  console.error('ERROR: Could not locate the target coupon points gifting handler inside Dashboard.tsx!');
}
