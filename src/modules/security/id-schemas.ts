import { z } from "zod";

export const UserIdSchema = z.string().trim().uuid({ message: 'Please sign in to continue.' });

export const CardIdSchema = z.string().trim().uuid({ message: 'That card was not found.' });

export const TransactionIdSchema = z.string().trim().uuid({ message: 'That payment was not found.' });

export const ScanIdSchema = z.string().trim().uuid({ message: 'That scan was not found.' });
