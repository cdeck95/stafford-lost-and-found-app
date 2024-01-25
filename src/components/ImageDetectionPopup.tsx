// PopupComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/ImageDetectionPopup.css";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";

interface PopupProps {
  data: Array<{ text: string; category: string }>;
  onClose: () => void;
  onUpdateCategory: (index: number, category: string) => void;
  onUpdateText: (index: number, text: string) => void;
  onDelete: (index: number) => void;
  prefillForm: () => void;
  categories: Array<string>;
}

const ImageDetectionPopup: React.FC<PopupProps> = ({
  data,
  onClose,
  onUpdateCategory,
  onUpdateText,
  onDelete,
  prefillForm,
  categories,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [isAnyCategorySelect, setIsAnyCategorySelect] =
    useState<boolean>(false);

  const startEditing = (text: string, index: number) => {
    setEditingIndex(index);
    setEditedText(text);
  };

  const saveEditing = () => {
    // Call your onUpdateCategory function with the updated text and editingIndex
    if (editingIndex !== null) {
      onUpdateText(editingIndex, editedText);
    }
    // Clear editing state
    setEditingIndex(null);
    setEditedText("");
  };

  const handleClickOutside = (event: MouseEvent) => {
    console.log("click outside");
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    // Add event listener
    document.addEventListener("click", handleClickOutside);

    return () => {
      // Remove event listener on cleanup
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Check if any category is "SELECT"
    console.log(data);
    const hasSelectCategory = data.some((item) => item.category === "");
    setIsAnyCategorySelect(hasSelectCategory);
  }, [data]);

  return (
    <div className="popup-container">
      <div className="popup-content" ref={popupRef}>
        {/* <button className="close-button" onClick={onClose}>
          X
        </button> */}
        <table>
          <thead>
            <tr>
              <th>Text</th>
              <th>Category</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onUpdateText(index, e.target.value)}
                    className="editable-text-input"
                  />
                  {/* {index === editingIndex ? (
                    // Display input field for editing
                    <div>
                      <input
                        type="text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                      />
                      <button onClick={saveEditing}>Save</button>
                    </div>
                  ) : (
                    // Display text and edit icon
                    <div>
                      {item.text}
                      <EditOutlinedIcon
                        sx={{ cursor: "pointer" }}
                        onClick={() => startEditing(item.text, index)}
                      />
                    </div>
                  )} */}
                </td>
                <td>
                  <select
                    value={item.category}
                    onChange={(e) => onUpdateCategory(index, e.target.value)}
                  >
                    {categories.map((category, categoryIndex) => (
                      <option key={categoryIndex} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <DeleteIcon
                    onClick={() => onDelete(index)} // Call onDelete with the index
                    sx={{
                      marginLeft: "20px",
                      marginTop: "5px",
                      cursor: "pointer",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row-apart">
          <p className="disclaimer">
            Text is captured via our AI Integration. As the model is always
            learning, you may experience wrong categories initially selected or
            text that is not needed. You can delete these by hitting the delete
            icon or simply click on the text you wish to edit.
          </p>
          <button
            disabled={editingIndex != null || isAnyCategorySelect}
            onClick={prefillForm}
            className="button-submit"
          >
            Submit to Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageDetectionPopup;
