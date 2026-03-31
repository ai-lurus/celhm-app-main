import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/sales', {
      branchId: 1,
      cashRegisterId: 1,
      lines: [
        {
          description: "Test",
          qty: 1,
          unitPrice: 100
        }
      ],
      payments: [
        { amount: 100, method: 'EFECTIVO' }
      ]
    });
    console.log(res.data);
  } catch (err: any) {
    if (err.response) {
      console.log('STATUS:', err.response.status);
      console.log('DATA:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log(err.message);
    }
  }
}
test();
