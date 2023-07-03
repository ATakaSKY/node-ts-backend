import express, { Request, Response, NextFunction } from "express";
import { UnitUser } from "./user.interface";
import { StatusCodes } from "http-status-codes";
import * as database from "./user.database";

export const userRouter = express.Router();

// Generic middleware for error handling
const handleErrors = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(error);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
};

// Apply the error handling middleware to all routes
userRouter.use(handleErrors);

// Define a wrapper function to handle the try-catch logic
const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Define your routes using the asyncHandler wrapper

userRouter.get("/users", asyncHandler(async (req: Request, res: Response) => {
  const allUsers: UnitUser[] = await database.findAll();

  if (!allUsers) {
    throw new Error(`No users at this time..`);
  }

  res.status(StatusCodes.OK).json({ total_user: allUsers.length, allUsers });
}));

userRouter.get("/user/:id", asyncHandler(async (req: Request, res: Response) => {
  const user: UnitUser = await database.findOne(req.params.id);

  if (!user) {
    throw new Error(`User not found!`);
  }

  res.status(StatusCodes.OK).json({ user });
}));

userRouter.post("/register", asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new Error(`Please provide all the required parameters..`);
  }

  const user = await database.findByEmail(email);

  if (user) {
    throw new Error(`This email has already been registered..`);
  }

  const newUser = await database.create(req.body);

  res.status(StatusCodes.CREATED).json({ newUser });
}));

userRouter.post("/login", asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error("Please provide all the required parameters..");
  }

  const user = await database.findByEmail(email);

  if (!user) {
    throw new Error("No user exists with the email provided..");
  }

  const comparePassword = await database.comparePassword(email, password);

  if (!comparePassword) {
    throw new Error(`Incorrect Password!`);
  }

  res.status(StatusCodes.OK).json({ user });
}));

userRouter.put("/user/:id", asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const getUser = await database.findOne(req.params.id);

  if (!username || !email || !password) {
    throw new Error(`Please provide all the required parameters..`);
  }

  if (!getUser) {
    throw new Error(`No user with id ${req.params.id}`);
  }

  const updateUser = await database.update(req.params.id, req.body);

  res.status(StatusCodes.CREATED).json({ updateUser });
}));

userRouter.delete("/user/:id", asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  const user = await database.findOne(id);

  if (!user) {
    throw new Error(`User does not exist`);
  }

  await database.remove(id);

  res.status(StatusCodes.OK).json({ message: "User deleted" });
}));
