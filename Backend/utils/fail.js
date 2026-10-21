const fail = (res, status, msg) =>
  res.status(status).json({ msg, success: false });

export default fail;
