import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fantasy-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Validates credentials and returns JWT.
   */
  fastify.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid input format' });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  });

  /**
   * POST /auth/register (Admin use for seeding or setup)
   * Create new user with hashed password.
   */
  fastify.post('/register', async (request, reply) => {
    // In production, we'd protect this with an admin check
    const { email, password, role } = request.body as any;
    
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'PLAYER',
      },
    });

    return { success: true, user: { id: user.id, email: user.email } };
  });

  /**
   * GET /auth/me
   * Validate token and return current user.
   */
  fastify.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      
      if (!user) return reply.code(404).send({ error: 'User not found' });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  });
}
