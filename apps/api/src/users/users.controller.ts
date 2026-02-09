import { Controller, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { UsersService } from "./users.service";

// ✅ All three imported from the SAME shared package
import {
  validateCreateUser,
  ICreateUserRequest,
  ICreateUserResponse,
  ERROR_MESSAGES,
  API_ENDPOINTS,
} from "@myproject/shared";

@Controller(API_ENDPOINTS.USERS)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() body: ICreateUserRequest): ICreateUserResponse {
    // ✅ Backend validation using the SAME shared function
    const validation = validateCreateUser(body);

    if (!validation.isValid) {
      throw new HttpException(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
          data: null,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Create user (in-memory for demo)
    const user = this.usersService.create(body);

    return {
      success: true,
      message: ERROR_MESSAGES.USER_CREATED,
      data: user,
    };
  }
}
