import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

interface BaseButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface ButtonAsButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps>, BaseButtonProps {
  href?: never;
}

interface ButtonAsLinkProps extends BaseButtonProps {
  href: string;
  onClick?: never;
  type?: never;
  children: React.ReactNode;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles = {
  primary: 'bg-pink-600 text-white hover:bg-pink-700',
  outline: 'bg-white text-pink-600 border border-pink-600 hover:bg-pink-50',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100'
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  href,
  ...props
}: ButtonProps) {
  const baseClassName = cn(
    'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2',
    variantStyles[variant],
    sizeStyles[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={baseClassName}
      {...(props as ButtonAsButtonProps)}
    >
      {children}
    </button>
  );
} 