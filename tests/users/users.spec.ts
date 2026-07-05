import { test, expect, request } from "@playwright/test";
import { UsersSchema } from "../../app/users.schema.ts";
import { UserSchema } from "../../app/users.schema.ts";

function randomNum() {
  return Math.floor(Math.random() * 1_000_000);
}

test.describe("Several tests", () => {
  let UserCreatedId: number;

  test.beforeEach("New User creation", async ({ request }) => {
    const name = "NewUser" + randomNum();
    let newUser = {
      name: name,
      email: `user${randomNum()}@gmail.com`,
      avatar: `https://picsum.photos/800`,
      password: `${name}1`,
    };
    let newUserUpdatedFields = {
      name: name + "update",
      email: `userUpdates${randomNum()}@gmail.com`,
    };
    console.log(newUser.password);
    console.log(newUserUpdatedFields.email);
    console.log(newUserUpdatedFields.name);

    const userCreation = await test.step("Creation by Post", async () => {
      const response = await request.post("/api/v1/users/", {
        data: newUser,
        failOnStatusCode: true,
      });
      const userCreatedJson = await response.json();
      const userCreatedHeaders = response.headers();
      UserCreatedId = userCreatedJson.id;
      console.log(userCreatedHeaders);
      return {
        response,
        userCreatedJson,
        UserCreatedId,
        userCreatedHeaders,
      };
    });

    await test.step("Check response status", async () => {
      expect(userCreation.response.status()).toBe(201);
      expect(userCreation.UserCreatedId).toBeDefined();
      expect(typeof userCreation.UserCreatedId).toBe("number");
      expect(userCreation.userCreatedJson.name).toEqual(newUser.name);
      expect(userCreation.userCreatedJson.email).toEqual(newUser.email);
      expect(userCreation.userCreatedJson.password).toEqual(newUser.password);
      expect(userCreation.userCreatedJson.avatar).toEqual(newUser.avatar);
    });

    await test.step("Check headers", async () => {
      expect
        .soft(Number(userCreation.userCreatedHeaders["content-length"]))
        .toBeGreaterThan(100);
      expect
        .soft(userCreation.userCreatedHeaders["content-type"])
        .toEqual("application/json; charset=utf-8");
    });
  });

  test(
    "Get list of users",
    { tag: ["@GetListOfUsers"] },
    async ({ request }) => {
      // Act
      const getResponseResult =
        await test.step("Creating list of users", async () => {
          const response = await request.get("/api/v1/users", {
            failOnStatusCode: true,
          });

          const json = await response.json();
          console.log(json);
          return json;
        });

      // Assert
      await test.step("Check json", async () => {
        expect(getResponseResult.length).toBeGreaterThan(0);
        expect(
          getResponseResult.some(
            (item: { id: number }) => item.id === UserCreatedId,
          ),
        ).toBe(true);
        for (const user of getResponseResult) {
          expect(user.id).toBeDefined();
          expect(typeof user.id).toBe("number");
          expect(user.email).toBeDefined();
          expect(user.name).toBeDefined();
        }
      });
      await test.step("Check scheme json", async () => {
        const result = UsersSchema.safeParse(getResponseResult);
        if (!result.success) {
          console.log(JSON.stringify(result.error.format(), null, 2));
        }
        expect(result.success).toBe(true);
      });
    },
  );

  test(
    "Get user using id",
    { tag: ["@GetOneUserWithId"] },
    async ({ request }) => {
      const GetUserid = await test.step("GetUserId", async () => {
        const IdResponse = await request.get(`/api/v1/users/${UserCreatedId}`, {
          failOnStatusCode: true,
        });
        const json = await IdResponse.json();
        console.log(json);
        return {
          IdResponse,
          json,
        };
      });

      await test.step("Check response status", async () => {
        expect(GetUserid.IdResponse.status()).toBe(200);
      });
      await test.step("Check headers", async () => {
        const headers = GetUserid.IdResponse.headers();
        expect.soft(headers["content-type"]).toBeDefined();
        expect.soft(headers[""]);
      });

      await test.step("Check id user", async () => {
        expect(GetUserid.json.id).toBe(UserCreatedId);
      });

      await test.step("Check user schema", async () => {
        const result = UserSchema.safeParse(GetUserid.json);
        if (!result.success) {
          console.log(JSON.stringify(result.error.format(), null, 2));
        }
        expect(result.success).toBe(true);
      });
    },
  );

  test("Update user", { tag: ["@UpdateUser"] }, async ({ request }) => {
    const nameUpdated = "NewUser" + randomNum();
    let newUserUpdatedFields = {
      name: nameUpdated,
      email: `userUpdates${randomNum()}@gmail.com`,
    };

    const updatedUser = await test.step("Update user ", async () => {
      const putResp = await request.put(`/api/v1/users/${UserCreatedId}`, {
        data: newUserUpdatedFields,
        failOnStatusCode: true,
      });
      const jsonUpdatedProduct = await putResp.json();
      return {
        putResp,
        jsonUpdatedProduct,
      };
    });
    await test.step("CheckUpdatedUser", async () => {
      expect(updatedUser.putResp.status()).toBe(200);
      expect(updatedUser.jsonUpdatedProduct.name).toEqual(
        newUserUpdatedFields.name,
      );
      expect(updatedUser.jsonUpdatedProduct.email).toEqual(
        newUserUpdatedFields.email,
      );
    });

    await test.step("Check scheme json", async () => {
      const result = UserSchema.safeParse(updatedUser.jsonUpdatedProduct);

      if (!result.success) {
        console.log(JSON.stringify(result.error.format(), null, 2));
      }
      expect(result.success).toBe(true);
    });
  });
});
