export interface AuthForm {
  email: string
  password: string
}

export interface RegisterForm extends AuthForm {
  nickname: string
}
