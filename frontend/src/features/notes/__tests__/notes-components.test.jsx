import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotesHeader from '../components/NotesHeader';
import NotesPagination from '../components/NotesPagination';
import NoteColorPicker from '../components/NoteColorPicker';
import NoteTypeSelector from '../components/NoteTypeSelector';
import NoteTagsInput from '../components/NoteTagsInput';

describe('Notes Decomposed Components Integration', () => {
  describe('NotesHeader', () => {
    it('renders title, description and triggers action callbacks', () => {
      const onViewModeChange = jest.fn();
      const onNewNote = jest.fn();

      render(
        <NotesHeader
          viewMode='grid'
          onViewModeChange={onViewModeChange}
          onNewNote={onNewNote}
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(
        screen.getByText(/Your personal investment log/i)
      ).toBeInTheDocument();

      // View mode toggle
      const listButton = screen.getByLabelText('List view');
      fireEvent.click(listButton);
      expect(onViewModeChange).toHaveBeenCalledWith('list');

      // New note button
      const newNoteButton = screen.getByText('New note');
      fireEvent.click(newNoteButton);
      expect(onNewNote).toHaveBeenCalledTimes(1);
    });
  });

  describe('NotesPagination', () => {
    it('returns null when totalPages <= 1', () => {
      const { container } = render(
        <NotesPagination
          page={0}
          totalPages={1}
          totalElements={15}
          pageSize={20}
          onPageChange={jest.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders pagination indicators and controls for multi-page results', () => {
      const onPageChange = jest.fn();
      render(
        <NotesPagination
          page={0}
          totalPages={3}
          totalElements={45}
          pageSize={20}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText('Showing 1–20 of 45')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(1);

      // Previous button should be disabled on page 0
      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });
  });

  describe('NoteColorPicker', () => {
    it('renders color swatches and triggers onSelectColor', () => {
      const onSelectColor = jest.fn();
      render(
        <NoteColorPicker selectedColor='slate' onSelectColor={onSelectColor} />
      );

      expect(screen.getByText('Note status color')).toBeInTheDocument();

      // Click Amber swatch
      const amberButton = screen.getByLabelText('Amber');
      fireEvent.click(amberButton);
      expect(onSelectColor).toHaveBeenCalledWith('amber');
    });
  });

  describe('NoteTypeSelector', () => {
    const mockPresets = [
      { id: 'idea', label: 'Idea' },
      { id: 'conviction', label: 'Why I bought' },
      { id: 'thought', label: 'Market thoughts' },
      { id: 'lesson', label: 'Lessons' },
    ];
    const mockCustomTypes = [
      { id: 'crypto', label: 'Crypto' },
      { id: 'dividends', label: 'Dividends' },
    ];

    it('renders presets and custom types and handles selection', () => {
      const onSelectType = jest.fn();
      const onDeleteCustomType = jest.fn();

      render(
        <NoteTypeSelector
          presets={mockPresets}
          selectedType='idea'
          onSelectType={onSelectType}
          customTypes={mockCustomTypes}
          onDeleteCustomType={onDeleteCustomType}
          isAddingCustomType={false}
          setIsAddingCustomType={jest.fn()}
          newCustomTypeInput=''
          setNewCustomTypeInput={jest.fn()}
          onAddCustomType={jest.fn()}
          customTypeInputRef={{ current: null }}
        />
      );

      expect(screen.getByText('Idea')).toBeInTheDocument();
      expect(screen.getByText('Why I bought')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
      expect(screen.getByText('Dividends')).toBeInTheDocument();

      // Click Why I bought
      fireEvent.click(screen.getByText('Why I bought'));
      expect(onSelectType).toHaveBeenCalledWith('conviction');

      // Click corner delete cross for Crypto
      const deleteCryptoBtn = screen.getByLabelText('Delete Crypto');
      fireEvent.click(deleteCryptoBtn);
      expect(onDeleteCustomType).toHaveBeenCalledWith('crypto');
    });
  });

  describe('NoteTagsInput', () => {
    it('renders tags and triggers add and remove callbacks', () => {
      const onAddTag = jest.fn();
      const onRemoveTag = jest.fn();

      render(
        <NoteTagsInput
          tags={['stocks', 'midcap']}
          tagInput=''
          onTagInputChange={jest.fn()}
          onTagKeyDown={jest.fn()}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          suggestedTags={['banking', 'tech']}
        />
      );

      expect(screen.getByText('#stocks')).toBeInTheDocument();
      expect(screen.getByText('#midcap')).toBeInTheDocument();

      // Remove stocks tag
      const removeStocks = screen.getByLabelText('Remove tag stocks');
      fireEvent.click(removeStocks);
      expect(onRemoveTag).toHaveBeenCalledWith('stocks');

      // Click quick tag suggestion
      const bankingQuickTag = screen.getByText('#banking');
      fireEvent.click(bankingQuickTag);
      expect(onAddTag).toHaveBeenCalledWith('banking');
    });
  });
});
