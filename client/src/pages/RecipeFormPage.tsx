import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { useCreateRecipe, useUpdateRecipe, useRecipe } from '../features/recipes/hooks';
import api from '../services/api';

const UNITS = ['', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'cups', 'piece', 'pieces', 'clove', 'cloves', 'slice', 'slices', 'pinch', 'pinches', 'oz', 'lb', 'bunch', 'handful', 'can', 'cans', 'whole'];

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description too short'),
  originalServings: z.coerce.number().int().positive('Must be at least 1').max(1000),
  cookingTimeMinutes: z.coerce.number().int().positive('Must be at least 1 minute'),
  tags: z.string(),
  ingredients: z.array(z.object({
    name: z.string().trim().min(1, 'Name required'),
    quantity: z.coerce.number().positive('Must be > 0'),
    unit: z.string().default(''),
  })).min(1, 'At least one ingredient'),
  instructions: z.array(z.object({
    text: z.string().trim().min(1, 'Step text required'),
  })).min(1, 'At least one step'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  mode?: 'create' | 'edit';
}

export default function RecipeFormPage({ mode = 'create' }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  const { data: existingRecipe } = useRecipe(isEdit ? id! : '');
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const [imageUrl, setImageUrl] = useState(existingRecipe?.imageUrl || '');
  const [imagePreview, setImagePreview] = useState(existingRecipe?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingRecipe
      ? {
          title: existingRecipe.title,
          description: existingRecipe.description,
          originalServings: existingRecipe.originalServings,
          cookingTimeMinutes: existingRecipe.cookingTimeMinutes,
          tags: existingRecipe.tags.join(', '),
          ingredients: existingRecipe.ingredients.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
          })),
          instructions: existingRecipe.instructions.map(i => ({ text: i.text })),
        }
      : {
          title: '',
          description: '',
          originalServings: 4,
          cookingTimeMinutes: 30,
          tags: '',
          ingredients: [{ name: '', quantity: 1, unit: '' }],
          instructions: [{ text: '' }],
        },
  });

  const { fields: ingFields, append: addIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' });
  const { fields: stepFields, append: addStep, remove: removeStep } = useFieldArray({ control, name: 'instructions' });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const form = new FormData();
    form.append('image', file);

    try {
      const res = await api.post('/uploads/recipe-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.imageUrl;
      setImageUrl(url);
      setImagePreview(url);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setUploadError(msg || 'Upload failed. Please try a different image.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError('');
    const tags = data.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const payload = {
      title: data.title,
      description: data.description,
      originalServings: data.originalServings,
      cookingTimeMinutes: data.cookingTimeMinutes,
      tags,
      imageUrl,
      ingredients: data.ingredients.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
      instructions: data.instructions.map((s, idx) => ({
        stepNumber: idx + 1,
        text: s.text,
      })),
    };

    try {
      if (isEdit && existingRecipe) {
        const updated = await updateRecipe.mutateAsync({ id: existingRecipe._id, data: payload });
        navigate(`/recipes/${updated.slug}`);
      } else {
        const created = await createRecipe.mutateAsync(payload);
        navigate(`/recipes/${created.slug}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg || 'Failed to save recipe. Please try again.');
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
        {isEdit ? 'Edit Recipe' : 'Create New Recipe'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Basic Information</h2>

          <div>
            <label className="label" htmlFor="title">Recipe Title *</label>
            <input id="title" {...register('title')} className="input" placeholder="e.g. Classic Banana Bread" />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="description">Description *</label>
            <textarea id="description" {...register('description')} rows={4} className="input resize-none" placeholder="Describe your recipe, its flavors, and what makes it special..." />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="servings">Servings *</label>
              <input id="servings" type="number" min={1} max={1000} {...register('originalServings')} className="input" />
              {errors.originalServings && <p className="error-text">{errors.originalServings.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="cookTime">Cooking Time (minutes) *</label>
              <input id="cookTime" type="number" min={1} {...register('cookingTimeMinutes')} className="input" />
              {errors.cookingTimeMinutes && <p className="error-text">{errors.cookingTimeMinutes.message}</p>}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input id="tags" {...register('tags')} className="input" placeholder="e.g. breakfast, quick, vegetarian" />
          </div>
        </div>

        {/* Image upload */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">Recipe Photo</h2>

          {imagePreview ? (
            <div className="relative mb-4">
              <img src={imagePreview} alt="Recipe preview" className="rounded-lg w-full max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => { setImageUrl(''); setImagePreview(''); }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : null}

          <div className="flex gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              aria-label="Upload recipe photo"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">JPEG, PNG, or WebP. Max 5MB.</p>
          {uploadError && <p className="error-text mt-2">{uploadError}</p>}
        </div>

        {/* Ingredients */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">Ingredients</h2>
          <div className="space-y-3">
            {ingFields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <input
                    {...register(`ingredients.${i}.name`)}
                    placeholder="Ingredient name"
                    className="input"
                    aria-label={`Ingredient ${i + 1} name`}
                  />
                  {errors.ingredients?.[i]?.name && (
                    <p className="error-text">{errors.ingredients[i]?.name?.message}</p>
                  )}
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    {...register(`ingredients.${i}.quantity`)}
                    placeholder="Qty"
                    className="input"
                    aria-label={`Ingredient ${i + 1} quantity`}
                  />
                  {errors.ingredients?.[i]?.quantity && (
                    <p className="error-text">{errors.ingredients[i]?.quantity?.message}</p>
                  )}
                </div>
                <div className="w-24">
                  <select {...register(`ingredients.${i}.unit`)} className="input" aria-label={`Ingredient ${i + 1} unit`}>
                    {UNITS.map(u => <option key={u} value={u}>{u || '(none)'}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeIng(i)}
                  disabled={ingFields.length === 1}
                  className="mt-1 p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  aria-label={`Remove ingredient ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addIng({ name: '', quantity: 1, unit: '' })}
            className="mt-4 flex items-center gap-2 text-sm text-forest hover:text-forest-dark transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Ingredient
          </button>
          {errors.ingredients?.root && <p className="error-text mt-2">{errors.ingredients.root.message}</p>}
        </div>

        {/* Instructions */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 mb-4">Instructions</h2>
          <div className="space-y-3">
            {stepFields.map((field, i) => (
              <div key={field.id} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-forest text-white flex items-center justify-center text-sm font-bold mt-2">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    {...register(`instructions.${i}.text`)}
                    rows={2}
                    placeholder={`Describe step ${i + 1}...`}
                    className="input resize-none"
                    aria-label={`Step ${i + 1} description`}
                  />
                  {errors.instructions?.[i]?.text && (
                    <p className="error-text">{errors.instructions[i]?.text?.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={stepFields.length === 1}
                  className="mt-2 p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  aria-label={`Remove step ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addStep({ text: '' })}
            className="mt-4 flex items-center gap-2 text-sm text-forest hover:text-forest-dark transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Step
          </button>
        </div>

        {/* Submit */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Publish Recipe'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
