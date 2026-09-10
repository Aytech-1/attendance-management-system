'use client';

import React, { useEffect } from 'react';
import { LayoutProps } from "@/types/ui";

const PageLayout = ({ children }: LayoutProps) => {
  useEffect(() => {
    console.log('[MOUNT] PageLayout');
  }, []);

  return (
    <main>{children}</main>
  );
};

export default PageLayout;
