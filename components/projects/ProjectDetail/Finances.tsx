import React from 'react';

/**
 * Компонент отображения финансов проекта.
 *
 * @component
 * @example
 * <Finances projectId="123" />
 */
export const Finances: React.FC<{ projectId: string }> = ({ projectId }) => {
  // TODO: реализовать загрузку и отображение финансовой информации из Supabase
  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-2">Финансы проекта</h3>
      <p>Здесь будет отображаться информация о доходах и расходах проекта {projectId}.</p>
    </div>
  );
};
