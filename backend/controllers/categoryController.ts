import { Request, Response } from 'express';
import { dataStore } from '../data/store.ts';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await dataStore.getCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error fetching categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, color, budget, icon } = req.body;

    const errors: Record<string, string> = {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Category name is required';
    } else if (name.trim().length > 40) {
      errors.name = 'Category name must be under 40 characters';
    }

    const categories = await dataStore.getCategories();
    const duplicate = categories.some((c) => c.name.toLowerCase() === name?.trim().toLowerCase());
    if (duplicate) {
      errors.name = 'A category with this name already exists';
    }

    if (color && !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      errors.color = 'Invalid hex color code (e.g., #3b82f6)';
    }

    const numBudget = Number(budget);
    if (budget !== undefined && (isNaN(numBudget) || numBudget < 0)) {
      errors.budget = 'Budget must be zero or a positive number';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const category = await dataStore.createCategory({
      name: name.trim(),
      color: color || '#3b82f6',
      budget: numBudget || 0,
      icon: icon || 'Tag',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error creating category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, budget, icon } = req.body;

    const existing = await dataStore.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const errors: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Category name cannot be empty';
      } else if (name.trim().length > 40) {
        errors.name = 'Category name must be under 40 characters';
      } else {
        const categories = await dataStore.getCategories();
        const duplicate = categories.some(
          (c) => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (duplicate) {
          errors.name = 'Another category with this name already exists';
        }
      }
    }

    if (color && !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      errors.color = 'Invalid hex color code';
    }

    if (budget !== undefined) {
      const numBudget = Number(budget);
      if (isNaN(numBudget) || numBudget < 0) {
        errors.budget = 'Budget must be zero or greater';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const updated = await dataStore.updateCategory(id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(color !== undefined && { color }),
      ...(budget !== undefined && { budget: Number(budget) }),
      ...(icon !== undefined && { icon }),
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error updating category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await dataStore.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if any expenses are attached to this category
    const expenses = await dataStore.getExpenses();
    const attachedCount = expenses.filter((e) => e.category === category.name).length;

    const { reassignTo } = req.query;
    if (attachedCount > 0 && !reassignTo) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete '${category.name}' because ${attachedCount} expense(s) are assigned to it. Reassign or delete those expenses first.`,
        attachedCount,
      });
    }

    // If reassign requested
    if (attachedCount > 0 && typeof reassignTo === 'string') {
      const targetCat = (await dataStore.getCategories()).find((c) => c.name === reassignTo);
      if (!targetCat) {
        return res.status(400).json({ success: false, message: 'Target category for reassignment not found' });
      }
      for (const exp of expenses.filter((e) => e.category === category.name)) {
        await dataStore.updateExpense(exp.id, { category: targetCat.name });
      }
    }

    const deleted = await dataStore.deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category could not be deleted' });
    }

    res.json({ success: true, message: `Category '${category.name}' deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error deleting category' });
  }
};
