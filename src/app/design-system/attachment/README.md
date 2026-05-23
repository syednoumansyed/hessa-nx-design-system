# DS Attachment Form Control Usage Examples

## Basic Usage

### PDF, Images, and Excel files with 5MB limit

```html
<ds-attachment-form-control [acceptFileTypes]="['PDF', 'IMAGES', 'EXCEL']" [maxSizeInMB]="5" [isMultiple]="true"> </ds-attachment-form-control>
```

### Word and PowerPoint documents only

```html
<ds-attachment-form-control [acceptFileTypes]="['WORD', 'PPT']" [maxSizeInMB]="10" [isMultiple]="false"> </ds-attachment-form-control>
```

### All supported file types

```html
<ds-attachment-form-control [acceptFileTypes]="['FILES']" [maxSizeInMB]="20"> </ds-attachment-form-control>
```

### Custom placeholder (overrides auto-generated)

```html
<ds-attachment-form-control [acceptFileTypes]="['PDF', 'WORD']" [maxSizeInMB]="5" placeholder="Upload your documents here"> </ds-attachment-form-control>
```

## Translation Keys Required

## Available File Types

- **IMAGES**: `jpg, jpeg, png, webp`
- **COMMON_IMAGES**: `jpg, jpeg, png`
- **VIDEOS**: `mp4`
- **PDF**: `pdf`
- **PPT**: `ppt, pptx`
- **WORD**: `doc, docx`
- **EXCEL**: `xls, xlsx`
- **FILES**: All document types combined (excludes images)

## Component Features

✅ **Localized placeholders** - Uses translation service for multi-language support
✅ **Dynamic file types** - Shows exact supported extensions
✅ **Excel support** - `.xls` and `.xlsx` files
✅ **Word support** - `.doc` and `.docx` files
✅ **PowerPoint support** - `.ppt` and `.pptx` files
✅ **Centralized logic** - All file type logic in `attachment-type.constant.ts`
✅ **Custom placeholders** - Override auto-generated text when needed
