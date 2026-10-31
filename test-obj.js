const obj = {
  test: function() { try { return true; } catch { return false; } },
  success: 'ok'
};
console.log(obj.test());